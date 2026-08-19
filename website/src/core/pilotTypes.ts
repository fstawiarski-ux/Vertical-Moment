export type PilotReleaseState = "assembly" | "review" | "ready";
export type PilotAssetStatus = "missing" | "review" | "ready";
export type PilotAssetKind = "image" | "video" | "model" | "panorama" | "link";

export type PilotAssetKey =
  | "hero"
  | "spatial"
  | "topo"
  | "model"
  | "panoramaPoster"
  | "panorama360"
  | "scrubRegionRock"
  | "scrubRockSector"
  | "scrubSectorTopo";

export interface PilotAssetSlot {
  kind: PilotAssetKind;
  status: PilotAssetStatus;
  /** Stable destination for the owner's future web-ready derivative. */
  targetPath: string;
  /** Null until a usable derivative exists. Empty binary placeholders are forbidden. */
  src: string | null;
  alt: string;
  bytes?: number;
  note?: string;
  /** Private-preview-only media. It never changes this slot's release readiness. */
  preview?: {
    adapter: "same-origin" | "hosted";
    src: string;
    provenance: string;
    verifiedForPilot: false;
    replaceable: true;
  };
}

export type PilotModuleKey = "locator" | "panorama" | "routes" | "wall" | "topo";

export interface PilotModuleCopy {
  title: string;
  mobileLabel: string;
  description: string;
  primarySlots: PilotAssetKey[];
}

export interface ExplorePilotManifest {
  schemaVersion: 1;
  id: string;
  label: string;
  releaseState: PilotReleaseState;
  identity: {
    region: string;
    regionSlug: string;
    crag: string;
    cragSlug: string;
    sector: string | null;
    canonicalCragId: string | null;
  };
  provenance: {
    notionUrl: string | null;
    dataPath: string | null;
    confidence: "provisional" | "imported-unverified" | "owner-reviewed";
    lastReviewed: string | null;
  };
  summary: {
    routeCount: number | null;
    gradeSystem: string | null;
    gradeRange: string | null;
    discipline: string | null;
  };
  journey: {
    posterSlot: PilotAssetKey;
    chapters: Array<{
      id: "region-rock" | "rock-sector" | "sector-topo";
      from: string;
      to: string;
      asset: PilotAssetKey;
      duration: number | null;
      direction: "forward" | "reverse";
      objectPosition?: string;
    }>;
  };
  modules: Record<PilotModuleKey, PilotModuleCopy>;
  assets: Record<PilotAssetKey, PilotAssetSlot>;
}

export interface PilotCatalogEntry {
  id: string;
  cragSlug: string;
  manifest: string;
  releaseState: PilotReleaseState;
}

export interface PilotCatalog {
  schemaVersion: 1;
  defaultPilot: string;
  pilots: PilotCatalogEntry[];
}

export type RegionalNodeRole = "core" | "spoke" | "reference" | "hero" | "extension";
export type RegionalMediaState = "verified" | "proxy-local" | "owner-reported" | "planned";

export interface RegionalPreviewNode {
  id: string;
  label: string;
  shortLabel: string;
  pilotId: string | null;
  role: RegionalNodeRole;
  coordinate: {
    latitude: number;
    longitude: number;
    source: string;
    confidence: "authoritative" | "corroborated" | "provisional";
  };
  relationship: string;
  routeCount: number | null;
  media: {
    state: RegionalMediaState;
    availability: "verified" | "owner-reported" | "not-available";
    label: string;
    poster: string;
    video: string | null;
    duration: number | null;
    sourcePilot: string | null;
    note: string;
  };
}

export interface RegionalPreviewManifest {
  schemaVersion: 1;
  id: string;
  label: string;
  eyebrow: string;
  summary: string;
  defaultNode: string;
  notionUrl: string;
  releaseState: "private-preview";
  nodes: RegionalPreviewNode[];
}
