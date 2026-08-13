import type { JourneyStation } from "./types";

export interface StationPresentation {
  label: string;
  focusBoxId: string;
  title: string;
  eyebrow: string;
  description: string;
  nextLabel: string;
}

/**
 * Journey stations choose a presentation, not a new data source. The existing
 * boxes remain addressable from search and deep links; station mode only
 * recommends which one to open while the cinematic journey is active.
 */
export const STATION_PRESENTATIONS: Record<JourneyStation, StationPresentation> = {
  region: {
    label: "Region",
    focusBoxId: "crag-locator",
    title: "Find a crag",
    eyebrow: "Atlas preview",
    description: "Start broad: browse regions, crags and route counts before the journey closes on the wall.",
    nextLabel: "Rock brings the wall study forward",
  },
  rock: {
    label: "Rock",
    focusBoxId: "wall-reveal",
    title: "Study the wall",
    eyebrow: "Nasenwand · place",
    description: "The landscape resolves into a wall study with photography, motion and provisional context.",
    nextLabel: "Sector opens the route context",
  },
  sector: {
    label: "Sector",
    focusBoxId: "nasenwand-spatial",
    title: "Read the sector",
    eyebrow: "Nasenwand · routes",
    description: "The selected sector becomes the working route view; supplied facts remain clearly provisional.",
    nextLabel: "Topo brings the wall layer forward",
  },
  topo: {
    label: "Topo",
    focusBoxId: "nasenwand-model",
    title: "Inspect the topo",
    eyebrow: "Nasenwand · spatial",
    description: "The journey arrives at the provisional topo and the shared 3D wall, loaded only when requested.",
    nextLabel: "Workspace ready",
  },
};

/** Midpoints keep continuous finger/slider scrubbing from switching at a station edge. */
export function stationForProgress(progress: number): JourneyStation {
  if (progress < 1 / 6) return "region";
  if (progress < 1 / 2) return "rock";
  if (progress < 5 / 6) return "sector";
  return "topo";
}

/** Resolve a deep-linked station box back to the journey station it represents. */
export function stationForFocusBoxId(boxId: string): JourneyStation | null {
  for (const station of ["region", "rock", "sector", "topo"] as const) {
    if (STATION_PRESENTATIONS[station].focusBoxId === boxId) return station;
  }
  return null;
}
