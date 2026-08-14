import { describe, expect, it } from "vitest";
import { EXPLORE_SAFE_ZONE, resizeBoxFrame, type ResizeDirection } from "./layoutAlgorithms";

const viewport = { width: 1440, height: 900 };
const origin = { x: 320, y: 260, width: 420, height: 300 };
const directions: ResizeDirection[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

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
