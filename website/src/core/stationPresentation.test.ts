import { describe, expect, it } from "vitest";
import { STATION_PRESENTATIONS, stationForFocusBoxId, stationForProgress } from "./stationPresentation";

describe("station presentation", () => {
  it("keeps the journey in four stable presentation states", () => {
    expect(stationForProgress(0)).toBe("region");
    expect(stationForProgress(0.2)).toBe("rock");
    expect(stationForProgress(0.5)).toBe("sector");
    expect(stationForProgress(0.84)).toBe("topo");
    expect(Object.keys(STATION_PRESENTATIONS)).toEqual(["region", "rock", "sector", "topo"]);
  });

  it("maps each station to an existing contextual box", () => {
    expect(Object.values(STATION_PRESENTATIONS).map((item) => item.focusBoxId)).toEqual([
      "crag-locator",
      "wall-reveal",
      "nasenwand-spatial",
      "nasenwand-model",
    ]);
  });

  it("resolves station deep links back to the correct journey station", () => {
    expect(stationForFocusBoxId("crag-locator")).toBe("region");
    expect(stationForFocusBoxId("wall-reveal")).toBe("rock");
    expect(stationForFocusBoxId("nasenwand-spatial")).toBe("sector");
    expect(stationForFocusBoxId("nasenwand-model")).toBe("topo");
    expect(stationForFocusBoxId("wachau-panorama")).toBeNull();
  });
});
