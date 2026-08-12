"use client";

import { createContext, createElement, useContext, useEffect, useRef, type ReactNode } from "react";
import { createStore, type StoreApi } from "zustand/vanilla";
import { useStore } from "zustand";
import { applyExploreLayout, applyGridLayout, applyPresentationLayout } from "./layoutAlgorithms";
import type { BoxState, LayoutMode, LayoutState, ViewportBounds } from "./types";

const STORAGE_KEY = "vertical-moment:explore-app:layout";
// 3: dropped the always-null heroBoxId left over from the pre-#28 hero shell.
const STORAGE_VERSION = 3;

const HISTORY_LIMIT = 50;
// A drag or resize dispatches UPDATE_BOX on every pointermove. Without
// coalescing, one gesture would bury the history under a hundred entries and
// undo would crawl back a pixel at a time.
const HISTORY_COALESCE_MS = 600;

export type LayoutAction =
  | { type: "ADD_BOX"; box: BoxState }
  | { type: "REMOVE_BOX"; id: string }
  | { type: "UPDATE_BOX"; id: string; patch: Partial<Omit<BoxState, "id">> }
  | { type: "SET_ACTIVE_BOX"; id: string | null }
  | { type: "SET_LAYOUT_MODE"; mode: LayoutMode }
  | { type: "APPLY_AUTO_LAYOUT"; viewport?: ViewportBounds }
  | { type: "MINIMIZE_ALL" }
  | { type: "RESET_LAYOUT"; state: LayoutState }
  | { type: "LOAD_STATE"; state: LayoutState };

interface PersistedLayout {
  version: number;
  state: LayoutState;
}

export interface LayoutStore extends LayoutState {
  hydrated: boolean;
  canUndo: boolean;
  canRedo: boolean;
  dispatch: (action: LayoutAction) => void;
  undo: () => void;
  redo: () => void;
  /** Returns every box to the position, size and mode the registry seeded. */
  reset: () => void;
  markHydrated: () => void;
}

const defaultState: LayoutState = {
  boxes: [],
  activeBoxId: null,
  layoutMode: "explore",
};

const validModes = new Set(["normal", "minimized", "expanded", "fullscreen"]);
const validLayouts = new Set(["explore", "grid", "presentation"]);

function isBoxState(value: unknown): value is BoxState {
  if (!value || typeof value !== "object") return false;
  const box = value as Partial<BoxState>;
  return typeof box.id === "string"
    && typeof box.type === "string"
    && typeof box.x === "number"
    && typeof box.y === "number"
    && typeof box.zIndex === "number"
    && typeof box.mode === "string"
    && validModes.has(box.mode)
    && typeof box.pinned === "boolean";
}

function isLayoutState(value: unknown): value is LayoutState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<LayoutState>;
  return Array.isArray(state.boxes)
    && state.boxes.every(isBoxState)
    && (state.activeBoxId === null || typeof state.activeBoxId === "string")
    && typeof state.layoutMode === "string"
    && validLayouts.has(state.layoutMode);
}

function mergePersistedState(persisted: LayoutState, fallback: LayoutState): LayoutState {
  const persistedById = new Map(persisted.boxes.map((box) => [box.id, box]));
  const boxes = fallback.boxes.map((fallbackBox) => {
    const saved = persistedById.get(fallbackBox.id);
    if (!saved) return fallbackBox;
    return {
      ...fallbackBox,
      ...saved,
      id: fallbackBox.id,
      type: fallbackBox.type,
      dataRef: fallbackBox.dataRef,
    };
  });
  const ids = new Set(boxes.map((box) => box.id));

  return {
    boxes,
    activeBoxId: persisted.activeBoxId && ids.has(persisted.activeBoxId) ? persisted.activeBoxId : null,
    layoutMode: persisted.layoutMode,
  };
}

export function layoutReducer(state: LayoutState, action: LayoutAction): LayoutState {
  switch (action.type) {
    case "ADD_BOX": {
      if (state.boxes.some((box) => box.id === action.box.id)) return state;
      const zIndex = Math.max(0, ...state.boxes.map((box) => box.zIndex)) + 1;
      return {
        ...state,
        boxes: [...state.boxes, { ...action.box, zIndex }],
        activeBoxId: action.box.id,
      };
    }
    case "REMOVE_BOX": {
      const boxes = state.boxes.filter((box) => box.id !== action.id);
      return {
        ...state,
        boxes,
        activeBoxId: state.activeBoxId === action.id ? null : state.activeBoxId,
      };
    }
    case "UPDATE_BOX":
      return {
        ...state,
        boxes: state.boxes.map((box) => box.id === action.id ? { ...box, ...action.patch, id: box.id } : box),
      };
    case "SET_ACTIVE_BOX": {
      if (action.id === null) return { ...state, activeBoxId: null };
      if (!state.boxes.some((box) => box.id === action.id)) return state;
      const zIndex = Math.max(0, ...state.boxes.map((box) => box.zIndex)) + 1;
      return {
        ...state,
        activeBoxId: action.id,
        boxes: state.boxes.map((box) => box.id === action.id ? { ...box, zIndex } : box),
      };
    }
    case "SET_LAYOUT_MODE":
      return { ...state, layoutMode: action.mode };
    case "APPLY_AUTO_LAYOUT": {
      const boxes = state.layoutMode === "grid"
        ? applyGridLayout(state.boxes, action.viewport)
        : state.layoutMode === "presentation"
          ? applyPresentationLayout(state.boxes, action.viewport, state.activeBoxId)
          : applyExploreLayout(state.boxes, action.viewport);
      return { ...state, boxes };
    }
    case "MINIMIZE_ALL":
      return {
        ...state,
        activeBoxId: null,
        boxes: state.boxes.map((box) => box.pinned ? box : { ...box, mode: "minimized" }),
      };
    case "RESET_LAYOUT":
    case "LOAD_STATE":
      return action.state;
    default:
      return state;
  }
}

/**
 * Actions that belong on the undo stack, keyed so that a continuous gesture
 * folds into a single entry. The patch signature keeps a drag ("x,y") from
 * being merged with a mode change ("mode") on the same box.
 */
function historyKey(action: LayoutAction): string | null {
  switch (action.type) {
    case "UPDATE_BOX":
      return `UPDATE_BOX:${action.id}:${Object.keys(action.patch).sort().join(",")}`;
    case "ADD_BOX":
    case "REMOVE_BOX":
    case "SET_LAYOUT_MODE":
    case "APPLY_AUTO_LAYOUT":
    case "MINIMIZE_ALL":
    case "RESET_LAYOUT":
      return action.type;
    default:
      return null;
  }
}

export function createLayoutStore(initialState: LayoutState = defaultState): StoreApi<LayoutStore> {
  return createStore<LayoutStore>()((set, get) => {
    let past: LayoutState[] = [];
    let future: LayoutState[] = [];
    let lastKey: string | null = null;
    let lastPushAt = 0;

    const snapshot = (): LayoutState => {
      const state = get();
      return { boxes: state.boxes, activeBoxId: state.activeBoxId, layoutMode: state.layoutMode };
    };

    const commit = (state: LayoutState) => set({
      ...state,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
    });

    return {
      ...initialState,
      hydrated: false,
      canUndo: false,
      canRedo: false,

      dispatch: (action) => {
        const before = snapshot();
        const after = layoutReducer(before, action);
        // The reducer returns its input untouched when an action is a no-op.
        if (after === before) return;

        // Hydrating a persisted workspace is not something the user did, so it
        // starts a fresh history rather than becoming an undoable step.
        if (action.type === "LOAD_STATE") {
          past = [];
          future = [];
          lastKey = null;
          commit(after);
          return;
        }

        const key = historyKey(action);
        if (key === null) {
          // A non-undoable action still ends the current gesture run.
          lastKey = null;
        } else {
          const now = Date.now();
          if (key !== lastKey || now - lastPushAt >= HISTORY_COALESCE_MS) {
            past = [...past, before].slice(-HISTORY_LIMIT);
            future = [];
          }
          lastKey = key;
          lastPushAt = now;
        }

        commit(after);
      },

      undo: () => {
        const previous = past[past.length - 1];
        if (!previous) return;
        past = past.slice(0, -1);
        future = [snapshot(), ...future].slice(0, HISTORY_LIMIT);
        lastKey = null;
        commit(previous);
      },

      redo: () => {
        const next = future[0];
        if (!next) return;
        future = future.slice(1);
        past = [...past, snapshot()].slice(-HISTORY_LIMIT);
        lastKey = null;
        commit(next);
      },

      reset: () => get().dispatch({ type: "RESET_LAYOUT", state: initialState }),

      markHydrated: () => set({ hydrated: true }),
    };
  });
}

const LayoutStoreContext = createContext<StoreApi<LayoutStore> | null>(null);

export function LayoutProvider({ children, initialState }: { children: ReactNode; initialState: LayoutState }) {
  const storeRef = useRef<StoreApi<LayoutStore> | null>(null);
  if (!storeRef.current) storeRef.current = createLayoutStore(initialState);

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;
    const layoutStore = store;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function hydrate() {
      try {
        const { get, set } = await import("idb-keyval");
        const persisted = await get<PersistedLayout>(STORAGE_KEY);
        if (cancelled) return;
        if (persisted?.version === STORAGE_VERSION && isLayoutState(persisted.state)) {
          layoutStore.getState().dispatch({
            type: "LOAD_STATE",
            state: mergePersistedState(persisted.state, initialState),
          });
        }
        layoutStore.getState().markHydrated();
        unsubscribe = layoutStore.subscribe((next) => {
          if (!next.hydrated) return;
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            const state: LayoutState = {
              boxes: next.boxes,
              activeBoxId: next.activeBoxId,
              layoutMode: next.layoutMode,
            };
            void set(STORAGE_KEY, { version: STORAGE_VERSION, state } satisfies PersistedLayout);
          }, 250);
        });
      } catch (error) {
        console.warn("Explore App layout persistence is unavailable.", error);
        layoutStore.getState().markHydrated();
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubscribe?.();
    };
  }, [initialState]);

  return createElement(LayoutStoreContext.Provider, { value: storeRef.current }, children);
}

export function useLayoutState<T = LayoutStore>(selector?: (state: LayoutStore) => T): T {
  const store = useContext(LayoutStoreContext);
  if (!store) throw new Error("useLayoutState must be used within LayoutProvider");
  return useStore(store, selector ?? ((state) => state as T));
}
