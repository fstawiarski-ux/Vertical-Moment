export type FieldOpsTier = "required" | "recommended" | "extra";

export interface FieldOpsCaptureItem {
  id: string;
  label: string;
  tier: FieldOpsTier;
  description: string;
}

export interface FieldOpsRelayItem {
  id: string;
  label: string;
  description: string;
}

export interface FieldOpsLink {
  label: string;
  url: string;
}

export interface FieldOpsStop {
  id: string;
  region: string;
  focus: string;
  mapsUrl: string;
  exploreUrl: string;
  notes?: string[];
}

export interface FieldOpsDay {
  id: string;
  label: string;
  routeLabel: string;
  routeUrl: string;
  stops: FieldOpsStop[];
  foodPlan: string;
  sleepPlan: string;
  redFlags: string[];
}

export interface FieldOpsWeekend {
  id: string;
  label: string;
  cluster: string;
  successCondition: string;
  days: FieldOpsDay[];
}

export interface FieldOpsPlan {
  version: number;
  title: string;
  updatedAt: string;
  liveChecks: FieldOpsLink[];
  captureItems: FieldOpsCaptureItem[];
  relayItems: FieldOpsRelayItem[];
  noteCategories: string[];
  hardRules: string[];
  dailyRoutine: string[];
  weekends: FieldOpsWeekend[];
}

export interface FieldOpsGpsFix {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  capturedAt: string;
}

export interface FieldOpsNote {
  id: string;
  category: string;
  text: string;
  createdAt: string;
  gps?: FieldOpsGpsFix;
}

export interface FieldOpsStopState {
  checks: Record<string, boolean>;
  relay: Record<string, boolean>;
  notes: FieldOpsNote[];
  gps?: FieldOpsGpsFix;
  updatedAt?: string;
}

export interface FieldOpsClientState {
  selectedWeekendId?: string;
  selectedDayId?: string;
  activeStopByDay: Record<string, string>;
  dates: Record<string, string>;
  stops: Record<string, FieldOpsStopState>;
}
