import { describe, expect, it } from "vitest";
import { modeForViewport, usesUnifiedHierarchy } from "./useViewportMode";

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

  it.each([
    ["mobile", null, false],
    ["mobile", "unified", false],
    ["tablet", null, true],
    ["tablet", "unified", true],
    ["tablet", "baseline", false],
    ["desktop", null, true],
    ["desktop", "unified", true],
    ["desktop", "baseline", false],
  ] as const)("uses unified hierarchy for %s with responsivePreview=%s: %s", (viewportMode, responsivePreview, expected) => {
    expect(usesUnifiedHierarchy(viewportMode, responsivePreview)).toBe(expected);
  });
});
