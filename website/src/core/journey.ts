import type { JourneyStation, ScrollScrubSequenceAsset } from "./types";

export const JOURNEY_STATIONS = ["region", "rock", "sector", "topo"] as const satisfies ReadonlyArray<JourneyStation>;

export const DEFAULT_STATION_PROGRESS: Record<JourneyStation, number> = {
  region: 0,
  rock: 1 / 3,
  sector: 2 / 3,
  topo: 1,
};

export interface JourneyStationDefinition {
  id: JourneyStation;
  index: number;
  label: string;
  role: "locator" | "wall" | "routes" | "topo";
  title: string;
  copy: string;
  progress: number;
}

const STATION_DEFINITIONS: Record<JourneyStation, Omit<JourneyStationDefinition, "id" | "index" | "progress">> = {
  region: {
    label: "Region",
    role: "locator",
    title: "Find a crag",
    copy: "Start broad: browse regions, crags and route counts before the journey closes on the wall.",
  },
  rock: {
    label: "Rock",
    role: "wall",
    title: "Study the wall",
    copy: "The landscape resolves into a wall study with photography, motion and provisional context.",
  },
  sector: {
    label: "Sector",
    role: "routes",
    title: "Read the sector",
    copy: "The selected sector becomes the working route view; supplied facts remain clearly provisional.",
  },
  topo: {
    label: "Topo",
    role: "topo",
    title: "Inspect the topo",
    copy: "The journey arrives at the provisional topo and the shared 3D wall, ready for inspection.",
  },
};

function validProgress(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

export function stationMarkersFor(sequence?: ScrollScrubSequenceAsset): Record<JourneyStation, number> {
  const requested = sequence?.master?.stations;
  if (!requested) return { ...DEFAULT_STATION_PROGRESS };

  const markers = JOURNEY_STATIONS.map((station) => requested[station]);
  if (!markers.every(validProgress) || markers.some((marker, index) => index > 0 && marker <= markers[index - 1])) {
    return { ...DEFAULT_STATION_PROGRESS };
  }

  return JOURNEY_STATIONS.reduce((resolved, station) => {
    resolved[station] = requested[station];
    return resolved;
  }, {} as Record<JourneyStation, number>);
}

export function journeyStationsFor(sequence?: ScrollScrubSequenceAsset): ReadonlyArray<JourneyStationDefinition> {
  const markers = stationMarkersFor(sequence);
  return JOURNEY_STATIONS.map((id, index) => ({
    id,
    index,
    ...STATION_DEFINITIONS[id],
    progress: markers[id],
  }));
}

/** Midpoints keep continuous finger/slider scrubbing from switching at a station edge. */
export function stationForProgress(
  progress: number,
  markers: Readonly<Record<JourneyStation, number>> = DEFAULT_STATION_PROGRESS,
): JourneyStation {
  const safeProgress = Math.max(0, Math.min(1, progress));
  const regionRockBoundary = (markers.region + markers.rock) / 2;
  const rockSectorBoundary = (markers.rock + markers.sector) / 2;
  const sectorTopoBoundary = (markers.sector + markers.topo) / 2;
  if (safeProgress < regionRockBoundary) return "region";
  if (safeProgress < rockSectorBoundary) return "rock";
  if (safeProgress < sectorTopoBoundary) return "sector";
  return "topo";
}
