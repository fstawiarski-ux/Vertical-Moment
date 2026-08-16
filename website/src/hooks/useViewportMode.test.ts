import { describe, expect, it } from "vitest";
import { modeForViewport } from "./useViewportMode";

describe("modeForViewport", () => {
  it.each([
    [390, 844, "mobile"],
    [844, 390, "mobile"],
    [768, 1024, "tablet"],
    [1024, 768, "tablet"],
    [1440, 900, "desktop"],
  ] as const)("classifies %sx%s as %s", (width, height, expected) => {
    expect(modeForViewport(width, height)).toBe(expected);
  });
});
