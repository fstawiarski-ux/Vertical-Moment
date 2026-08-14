import { describe, expect, it } from "vitest";
import {
  getCragPanoramaHref,
  getKnownCragPanoramaHref,
  getKnownPanoramaExperience,
} from "./panorama-experiences";

describe("panorama route registry", () => {
  it("accepts only registered regions and crags", () => {
    expect(getKnownPanoramaExperience("wachau")).not.toBeNull();
    expect(getKnownPanoramaExperience("wachau", "nasenwand")).not.toBeNull();
    expect(getKnownPanoramaExperience("unknown")).toBeNull();
    expect(getKnownPanoramaExperience("wachau", "unknown")).toBeNull();
  });

  it("uses the canonical media namespace and suppresses dead links", () => {
    expect(getCragPanoramaHref("Wachau", "Nasenwand")).toBe("/panoramas/wachau/nasenwand");
    expect(getKnownCragPanoramaHref("Wachau", "Nasenwand", "Aufwind")).toContain("route=Aufwind");
    expect(getKnownCragPanoramaHref("Peilstein", "Unknown Wall")).toBeNull();
  });
});
