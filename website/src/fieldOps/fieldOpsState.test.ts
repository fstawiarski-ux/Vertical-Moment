import { describe, expect, it } from "vitest";
import { FIELD_OPS_PLAN } from "./fieldOpsPlan";
import { EMPTY_FIELD_OPS_STATE, missingCaptureItems, normalizeFieldOpsState } from "./fieldOpsState";

describe("Field Ops client state", () => {
  it("orders missing work required before recommended before extra", () => {
    const gaps = missingCaptureItems(FIELD_OPS_PLAN, EMPTY_FIELD_OPS_STATE, "test");
    const tiers = gaps.map((item) => item.tier);
    expect(tiers.indexOf("recommended")).toBeGreaterThan(tiers.lastIndexOf("required"));
    expect(tiers.indexOf("extra")).toBeGreaterThan(tiers.lastIndexOf("recommended"));
  });

  it("falls back to the first configured weekend/day when stored selection is invalid", () => {
    const normalized = normalizeFieldOpsState(FIELD_OPS_PLAN, { selectedWeekendId: "missing", selectedDayId: "missing" });
    expect(normalized.selectedWeekendId).toBe(FIELD_OPS_PLAN.weekends[0].id);
    expect(normalized.selectedDayId).toBe(FIELD_OPS_PLAN.weekends[0].days[0].id);
  });
});
