import { describe, expect, it } from "vitest";
import { FIELD_OPS_PLAN } from "./fieldOpsPlan";

const EXPECTED_REGIONS = [
  "Adlitzgraben", "Alland", "Arnstein", "Baden", "Bucklige Welt", "Fischauer Vorberge", "Helenental", "Hirschwände", "Hocheck", "Hohe Wand",
  "Höllental-Rax", "Kaltenleutgebner Tal", "Lindkogel", "Mödling", "Neunkirchen", "Peilstein", "Pernitz", "Piestingtal", "Puchberg Grünbach", "Wöllersdorf Hart",
].sort();

describe("Field Ops trip plan", () => {
  it("covers the 20 canonical regions exactly once at region-stop level", () => {
    const regions = FIELD_OPS_PLAN.weekends.flatMap((weekend) => weekend.days.flatMap((day) => day.stops.map((stop) => stop.region))).sort();
    expect(regions).toEqual(EXPECTED_REGIONS);
  });

  it("contains exactly three weekends and nine field days", () => {
    expect(FIELD_OPS_PLAN.weekends).toHaveLength(3);
    expect(FIELD_OPS_PLAN.weekends.flatMap((weekend) => weekend.days)).toHaveLength(9);
  });

  it("keeps every day navigable and every capture checklist tier explicit", () => {
    for (const day of FIELD_OPS_PLAN.weekends.flatMap((weekend) => weekend.days)) {
      expect(day.routeUrl.startsWith("https://www.google.com/maps/dir/")).toBe(true);
      expect(day.stops.length).toBeGreaterThan(0);
    }
    expect(FIELD_OPS_PLAN.captureItems.every((item) => ["required", "recommended", "extra"].includes(item.tier))).toBe(true);
  });
});
