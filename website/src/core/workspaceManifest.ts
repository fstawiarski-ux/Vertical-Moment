import type { ExploreContentRegistry, JourneyStation } from "./types";
import { JOURNEY_STATIONS } from "./journey";
import { STATION_PRESENTATIONS, type StationPresentation } from "./stationPresentation";

const DEFAULT_MAX_BOXES = 5;
const DEFAULT_PHONE_PRIMARY_IDS = ["crag-locator", "nasenwand-spatial", "wachau-16"];

export interface ResolvedWorkspaceManifest {
  maxBoxes: number;
  phone: {
    singleActive: boolean;
    primaryModuleIds: string[];
  };
  stationFocus: Record<JourneyStation, string>;
}

function validMaxBoxes(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_MAX_BOXES;
  return Math.min(DEFAULT_MAX_BOXES, Math.max(1, Math.floor(value)));
}

export function resolveWorkspaceManifest(registry: ExploreContentRegistry): ResolvedWorkspaceManifest {
  const ids = new Set(registry.boxes.map((box) => box.id));
  const requestedPrimary = registry.workspace?.phone?.primaryModuleIds ?? DEFAULT_PHONE_PRIMARY_IDS;
  const primaryModuleIds = requestedPrimary.filter((id) => ids.has(id));
  const fallbackPrimary = registry.boxes.slice(0, 3).map((box) => box.id);
  const stationFocus = JOURNEY_STATIONS.reduce((resolved, station) => {
    const requested = registry.workspace?.stationFocus?.[station];
    const staticFallback = STATION_PRESENTATIONS[station].focusBoxId;
    resolved[station] = requested && ids.has(requested)
      ? requested
      : ids.has(staticFallback)
        ? staticFallback
        : fallbackPrimary[0] ?? "";
    return resolved;
  }, {} as Record<JourneyStation, string>);

  return {
    maxBoxes: validMaxBoxes(registry.workspace?.maxBoxes),
    phone: {
      // The reviewed manifest documents the policy; the runtime keeps the
      // safety invariant even if stale or malformed content says otherwise.
      singleActive: true,
      primaryModuleIds: primaryModuleIds.length > 0 ? primaryModuleIds : fallbackPrimary,
    },
    stationFocus,
  };
}

export function stationPresentationsFor(registry: ExploreContentRegistry): Record<JourneyStation, StationPresentation> {
  const manifest = resolveWorkspaceManifest(registry);
  return JOURNEY_STATIONS.reduce((resolved, station) => {
    const content = registry.boxes.find((box) => box.id === manifest.stationFocus[station]);
    const contentLabel = content?.crag?.trim();
    const eyebrow = contentLabel
      ? `${contentLabel} · ${station === "region" ? "atlas" : station === "rock" ? "wall" : station === "sector" ? "routes" : "spatial"}`
      : STATION_PRESENTATIONS[station].eyebrow;
    resolved[station] = {
      ...STATION_PRESENTATIONS[station],
      focusBoxId: manifest.stationFocus[station],
      eyebrow,
    };
    return resolved;
  }, {} as Record<JourneyStation, StationPresentation>);
}
