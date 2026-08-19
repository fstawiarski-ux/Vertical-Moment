import { describe, expect, it } from "vitest";
import {
  applyExploreLayout,
  compactJourneyFrame,
  EXPLORE_SAFE_ZONE,
  heroFirstFrameForBox,
  resizeBoxFrame,
  type ResizeDirection,
} from "./layoutAlgorithms";
import type { BoxState } from "./types";

const viewport = { width: 1440, height: 900 };
const origin = { x: 320, y: 260, width: 420, height: 300 };
const directions: ResizeDirection[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

const box = (id: string, index: number): BoxState => ({
  id,
  type: "image",
  x: 200 + index * 30,
  y: 180 + index * 20,
  width: 360,
  height: 280,
  zIndex: index + 1,
  mode: "normal",
  pinned: false,
  dataRef: id,
  stackIndex: index,
});

const overlaps = (a: BoxState, b: BoxState, gap = 1) => !(
  a.x + (a.width ?? 0) + gap <= b.x
  || b.x + (b.width ?? 0) + gap <= a.x
  || a.y + (a.height ?? 0) + gap <= b.y
  || b.y + (b.height ?? 0) + gap <= a.y
);

describe("resizeBoxFrame", () => {
  it.each(directions)("keeps %s resizing inside the safe zone", (direction) => {
    const frame = resizeBoxFrame(origin, direction, 2400, 2400, viewport);
    expect(frame.x).toBeGreaterThanOrEqual(EXPLORE_SAFE_ZONE.left);
    expect(frame.y).toBeGreaterThanOrEqual(EXPLORE_SAFE_ZONE.top);
    expect(frame.x + frame.width).toBeLessThanOrEqual(viewport.width - EXPLORE_SAFE_ZONE.right);
    expect(frame.y + frame.height).toBeLessThanOrEqual(viewport.height - EXPLORE_SAFE_ZONE.bottom);
    expect(frame.width).toBeGreaterThanOrEqual(210);
    expect(frame.height).toBeGreaterThanOrEqual(130);
  });

  it("moves the opposite edge for north-west resizing", () => {
    const frame = resizeBoxFrame(origin, "nw", -80, -70, viewport);
    expect(frame).toMatchObject({ x: 240, y: 190, width: 500, height: 370 });
  });

  it("normalizes stale origin geometry before applying a minimum-size clamp", () => {
    const frame = resizeBoxFrame({ x: -900, y: -900, width: 4, height: 4 }, "se", -500, -500, viewport);
    expect(frame).toEqual({ x: EXPLORE_SAFE_ZONE.left, y: EXPLORE_SAFE_ZONE.top, width: 210, height: 130 });
  });
});

describe("hero-first compact frames", () => {
  it("starts with a genuinely compact inspector inside the desktop safe zone", () => {
    const frame = compactJourneyFrame(viewport);

    expect(frame).toEqual({ x: 112, y: 128, width: 341, height: 240 });
    expect((frame.width * frame.height) / (viewport.width * viewport.height)).toBeLessThan(0.08);
    expect(frame.x + frame.width).toBeLessThanOrEqual(viewport.width - EXPLORE_SAFE_ZONE.right);
    expect(frame.y + frame.height).toBeLessThanOrEqual(viewport.height - EXPLORE_SAFE_ZONE.bottom);
  });

  it("keeps compact geometry at tablet-landscape dimensions", () => {
    const frame = compactJourneyFrame({ width: 1024, height: 768 });

    expect(frame.width).toBeLessThanOrEqual(300);
    expect(frame.height).toBeGreaterThanOrEqual(190);
    expect(frame.x).toBeGreaterThanOrEqual(EXPLORE_SAFE_ZONE.left);
    expect(frame.y).toBeGreaterThanOrEqual(EXPLORE_SAFE_ZONE.top);
  });

  it("restores named modules into stable outer-edge slots", () => {
    const atlas = heroFirstFrameForBox("crag-locator", viewport);
    const routes = heroFirstFrameForBox("nasenwand-spatial", viewport);
    const model = heroFirstFrameForBox("nasenwand-model", viewport);

    expect(atlas.x).toBeLessThan(viewport.width * 0.34);
    expect(routes.x).toBeGreaterThan(viewport.width * 0.5);
    expect(model.x).toBeGreaterThan(viewport.width * 0.5);
    expect(model.y).toBeGreaterThan(atlas.y);
  });
});

describe("hero-first Explore Align", () => {
  it("packs five modules without collisions and protects the visual centre", () => {
    const source = [
      box("crag-locator", 0),
      box("wachau-16", 1),
      box("nasenwand-spatial", 2),
      box("nasenwand-model", 3),
      box("wall-reveal", 4),
    ];
    const arranged = applyExploreLayout(source, viewport);
    const corridorLeft = viewport.width * 0.34;
    const corridorRight = viewport.width * 0.66;

    for (let i = 0; i < arranged.length; i += 1) {
      for (let j = i + 1; j < arranged.length; j += 1) {
        expect(overlaps(arranged[i], arranged[j], 4)).toBe(false);
      }
      const item = arranged[i];
      const itemRight = item.x + (item.width ?? 0);
      expect(item.x < corridorRight && itemRight > corridorLeft).toBe(false);
    }
  });
});
