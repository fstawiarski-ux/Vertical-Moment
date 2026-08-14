import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLayoutStore, layoutReducer } from "./layoutState";
import type { BoxState, LayoutState } from "./types";

function makeBox(id: string, overrides: Partial<BoxState> = {}): BoxState {
  return { id, type: "gallery", x: 0, y: 0, width: 200, height: 150, zIndex: 1, mode: "normal", pinned: false, ...overrides };
}

function seed(): LayoutState {
  return {
    boxes: [
      makeBox("a", { x: 10, y: 10, zIndex: 1 }),
      makeBox("b", { x: 300, y: 10, zIndex: 2 }),
      makeBox("c", { x: 10, y: 200, zIndex: 3, pinned: true }),
    ],
    activeBoxId: null,
    layoutMode: "explore",
  };
}

describe("layoutReducer", () => {
  it("returns the same state object for a no-op so callers can skip work", () => {
    const state = seed();
    expect(layoutReducer(state, { type: "SET_ACTIVE_BOX", id: "missing" })).toBe(state);
    expect(layoutReducer(state, { type: "ADD_BOX", box: makeBox("a") })).toBe(state);
  });

  it("raises a focused box above every other", () => {
    const next = layoutReducer(seed(), { type: "SET_ACTIVE_BOX", id: "a" });
    const zIndexes = next.boxes.map((box) => box.zIndex);
    expect(next.activeBoxId).toBe("a");
    expect(next.boxes.find((box) => box.id === "a")!.zIndex).toBe(Math.max(...zIndexes));
  });

  it("never lets a patch rewrite a box id", () => {
    const next = layoutReducer(seed(), { type: "UPDATE_BOX", id: "a", patch: { id: "hijacked" } as Partial<BoxState> });
    expect(next.boxes.map((box) => box.id)).toEqual(["a", "b", "c"]);
  });

  it("minimizes everything except pinned boxes", () => {
    const next = layoutReducer(seed(), { type: "MINIMIZE_ALL" });
    expect(next.boxes.map((box) => box.mode)).toEqual(["minimized", "minimized", "normal"]);
    expect(next.activeBoxId).toBeNull();
  });

  it("keeps expanded and fullscreen ownership exclusive", () => {
    const expanded = layoutReducer(seed(), { type: "SET_BOX_MODE", id: "a", mode: "expanded" });
    const fullscreen = layoutReducer(expanded, { type: "SET_BOX_MODE", id: "b", mode: "fullscreen" });
    expect(fullscreen.boxes.filter((box) => box.mode === "expanded" || box.mode === "fullscreen").map((box) => box.id)).toEqual(["b"]);
    expect(fullscreen.boxes.find((box) => box.id === "a")?.mode).toBe("normal");
  });

  it("restores the prior geometry after leaving fullscreen", () => {
    const entered = layoutReducer(seed(), { type: "SET_BOX_MODE", id: "a", mode: "fullscreen" });
    const changed = layoutReducer(entered, { type: "UPDATE_BOX", id: "a", patch: { x: 700, y: 500 } });
    const restored = layoutReducer(changed, { type: "SET_BOX_MODE", id: "a", mode: "normal" });
    expect(restored.boxes.find((box) => box.id === "a")).toMatchObject({ mode: "normal", x: 10, y: 10, width: 200, height: 150 });
  });

  it("restores expanded mode when fullscreen was entered from expanded", () => {
    const expanded = layoutReducer(seed(), { type: "SET_BOX_MODE", id: "a", mode: "expanded" });
    const fullscreen = layoutReducer(expanded, { type: "SET_BOX_MODE", id: "a", mode: "fullscreen" });
    const restored = layoutReducer(fullscreen, { type: "SET_BOX_MODE", id: "a", mode: "normal" });
    expect(restored.boxes.find((box) => box.id === "a")?.mode).toBe("expanded");
  });

  it("clears an exclusive restore frame when auto layout returns a box to normal", () => {
    const fullscreen = layoutReducer(seed(), { type: "SET_BOX_MODE", id: "a", mode: "fullscreen" });
    const relaidOut = layoutReducer(fullscreen, { type: "APPLY_AUTO_LAYOUT", viewport: { width: 1440, height: 900 } });
    expect(relaidOut.boxes.find((box) => box.id === "a")).toMatchObject({ mode: "normal", restoreFrame: undefined });
  });

  it("restores minimized boxes to their last valid frame", () => {
    const moved = layoutReducer(seed(), { type: "UPDATE_BOX", id: "a", patch: { x: 420, y: 240 } });
    const minimized = layoutReducer(moved, { type: "SET_BOX_MODE", id: "a", mode: "minimized" });
    const restored = layoutReducer(minimized, { type: "SET_BOX_MODE", id: "a", mode: "normal" });
    expect(restored.boxes.find((box) => box.id === "a")).toMatchObject({ mode: "normal", x: 420, y: 240 });
  });

  it("normalizes persisted layouts with multiple fullscreen owners", () => {
    const persisted = seed();
    persisted.boxes[0].mode = "fullscreen";
    persisted.boxes[1].mode = "fullscreen";
    const next = layoutReducer(seed(), { type: "LOAD_STATE", state: persisted });
    expect(next.boxes.filter((box) => box.mode === "fullscreen")).toHaveLength(1);
  });

  it("clears the active box when it is removed", () => {
    const focused = layoutReducer(seed(), { type: "SET_ACTIVE_BOX", id: "b" });
    const next = layoutReducer(focused, { type: "REMOVE_BOX", id: "b" });
    expect(next.activeBoxId).toBeNull();
    expect(next.boxes).toHaveLength(2);
  });

  it("normalizes RESET_LAYOUT and LOAD_STATE without changing valid content", () => {
    const replacement = seed();
    expect(layoutReducer(seed(), { type: "RESET_LAYOUT", state: replacement })).toEqual(replacement);
    expect(layoutReducer(seed(), { type: "LOAD_STATE", state: replacement })).toEqual(replacement);
  });
});

describe("undo and redo", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const store = () => createLayoutStore(seed());

  it("starts with nothing to undo or redo", () => {
    const s = store().getState();
    expect(s.canUndo).toBe(false);
    expect(s.canRedo).toBe(false);
  });

  it("undoes a layout change and redoes it again", () => {
    const s = store();
    s.getState().dispatch({ type: "MINIMIZE_ALL" });
    expect(s.getState().boxes[0].mode).toBe("minimized");
    expect(s.getState().canUndo).toBe(true);

    s.getState().undo();
    expect(s.getState().boxes[0].mode).toBe("normal");
    expect(s.getState().canUndo).toBe(false);
    expect(s.getState().canRedo).toBe(true);

    s.getState().redo();
    expect(s.getState().boxes[0].mode).toBe("minimized");
    expect(s.getState().canRedo).toBe(false);
  });

  it("collapses a continuous drag into a single history entry", () => {
    const s = store();
    for (let x = 1; x <= 25; x += 1) {
      s.getState().dispatch({ type: "UPDATE_BOX", id: "a", patch: { x, y: x } });
      vi.advanceTimersByTime(16);
    }
    expect(s.getState().boxes[0].x).toBe(25);

    s.getState().undo();
    expect(s.getState().boxes[0].x, "one gesture should rewind in one step").toBe(10);
    expect(s.getState().canUndo).toBe(false);
  });

  it("starts a new history entry once the gesture window lapses", () => {
    const s = store();
    s.getState().dispatch({ type: "UPDATE_BOX", id: "a", patch: { x: 50, y: 50 } });
    vi.advanceTimersByTime(1000);
    s.getState().dispatch({ type: "UPDATE_BOX", id: "a", patch: { x: 90, y: 90 } });

    s.getState().undo();
    expect(s.getState().boxes[0].x).toBe(50);
    s.getState().undo();
    expect(s.getState().boxes[0].x).toBe(10);
  });

  it("keeps a drag and a mode change on the same box separate", () => {
    const s = store();
    s.getState().dispatch({ type: "UPDATE_BOX", id: "a", patch: { x: 60, y: 60 } });
    s.getState().dispatch({ type: "UPDATE_BOX", id: "a", patch: { mode: "minimized" } });

    s.getState().undo();
    expect(s.getState().boxes[0].mode, "the minimize should undo on its own").toBe("normal");
    expect(s.getState().boxes[0].x).toBe(60);
  });

  it("keeps concurrent drags of different boxes separate", () => {
    const s = store();
    s.getState().dispatch({ type: "UPDATE_BOX", id: "a", patch: { x: 60, y: 60 } });
    s.getState().dispatch({ type: "UPDATE_BOX", id: "b", patch: { x: 400, y: 60 } });

    s.getState().undo();
    expect(s.getState().boxes[1].x).toBe(300);
    expect(s.getState().boxes[0].x).toBe(60);
  });

  it("does not put focus changes on the history stack", () => {
    const s = store();
    s.getState().dispatch({ type: "SET_ACTIVE_BOX", id: "a" });
    s.getState().dispatch({ type: "SET_ACTIVE_BOX", id: "b" });
    expect(s.getState().canUndo).toBe(false);
  });

  it("lets a focus change interrupt a gesture run", () => {
    const s = store();
    s.getState().dispatch({ type: "UPDATE_BOX", id: "a", patch: { x: 60, y: 60 } });
    s.getState().dispatch({ type: "SET_ACTIVE_BOX", id: "b" });
    s.getState().dispatch({ type: "UPDATE_BOX", id: "a", patch: { x: 70, y: 70 } });

    s.getState().undo();
    expect(s.getState().boxes[0].x).toBe(60);
  });

  it("drops the redo stack once a new change is made", () => {
    const s = store();
    s.getState().dispatch({ type: "MINIMIZE_ALL" });
    s.getState().undo();
    expect(s.getState().canRedo).toBe(true);

    vi.advanceTimersByTime(1000);
    s.getState().dispatch({ type: "SET_LAYOUT_MODE", mode: "grid" });
    expect(s.getState().canRedo).toBe(false);
  });

  it("clears history when a persisted workspace is hydrated", () => {
    const s = store();
    s.getState().dispatch({ type: "MINIMIZE_ALL" });
    expect(s.getState().canUndo).toBe(true);

    s.getState().dispatch({ type: "LOAD_STATE", state: seed() });
    expect(s.getState().canUndo, "hydration is not something the user did").toBe(false);
    expect(s.getState().canRedo).toBe(false);
  });

  it("restores the seeded layout on reset, and the reset itself is undoable", () => {
    const s = store();
    s.getState().dispatch({ type: "UPDATE_BOX", id: "a", patch: { x: 500, y: 500 } });
    vi.advanceTimersByTime(1000);

    s.getState().reset();
    expect(s.getState().boxes[0].x).toBe(10);

    s.getState().undo();
    expect(s.getState().boxes[0].x).toBe(500);
  });

  it("ignores undo and redo when there is nothing to move to", () => {
    const s = store();
    s.getState().undo();
    s.getState().redo();
    expect(s.getState().boxes[0].x).toBe(10);
    expect(s.getState().canUndo).toBe(false);
    expect(s.getState().canRedo).toBe(false);
  });
});
