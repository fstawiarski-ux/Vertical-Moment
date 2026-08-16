import type { FieldOpsCaptureItem, FieldOpsClientState, FieldOpsPlan, FieldOpsStopState } from "./types";

export const EMPTY_FIELD_OPS_STATE: FieldOpsClientState = {
  activeStopByDay: {},
  dates: {},
  stops: {},
};

export function stopStateFor(state: FieldOpsClientState, stopId: string): FieldOpsStopState {
  return state.stops[stopId] ?? { checks: {}, relay: {}, notes: [] };
}

export function missingCaptureItems(plan: FieldOpsPlan, state: FieldOpsClientState, stopId: string): FieldOpsCaptureItem[] {
  const stopState = stopStateFor(state, stopId);
  const tierWeight = { required: 0, recommended: 1, extra: 2 } as const;
  return plan.captureItems
    .filter((item) => !stopState.checks[item.id])
    .sort((left, right) => tierWeight[left.tier] - tierWeight[right.tier] || left.label.localeCompare(right.label));
}

export function normalizeFieldOpsState(plan: FieldOpsPlan, stored: unknown): FieldOpsClientState {
  const firstWeekend = plan.weekends[0];
  const firstDay = firstWeekend?.days[0];
  const candidate = stored && typeof stored === "object" ? stored as Partial<FieldOpsClientState> : {};
  return {
    selectedWeekendId: candidate.selectedWeekendId && plan.weekends.some((weekend) => weekend.id === candidate.selectedWeekendId)
      ? candidate.selectedWeekendId
      : firstWeekend?.id,
    selectedDayId: candidate.selectedDayId && plan.weekends.some((weekend) => weekend.days.some((day) => day.id === candidate.selectedDayId))
      ? candidate.selectedDayId
      : firstDay?.id,
    activeStopByDay: candidate.activeStopByDay && typeof candidate.activeStopByDay === "object" ? candidate.activeStopByDay : {},
    dates: candidate.dates && typeof candidate.dates === "object" ? candidate.dates : {},
    stops: candidate.stops && typeof candidate.stops === "object" ? candidate.stops : {},
  };
}
