/**
 * Canonical climbing-data model: Region → Crag → Sector → Route.
 *
 * This is the ONE shape every part of the platform (map, browse panel,
 * per-crag pages, search) programs against. It is not a new dataset — it's
 * the typed view that adapters (climbing-adapter.ts) produce from
 * database/api/v1/*, which stays the single source of truth on disk.
 *
 * Sector is a real level in the guidebook (v4 master workbook already
 * carries a Sector column) but the currently-generated api/v1 routes don't
 * yet group by it — so `sectorId`/`sector` are optional everywhere. Adding
 * sector data later is additive: populate the field in build_api.py's
 * output, adapters pass it through, nothing here has to change shape.
 */

export type LinkKind = "exact" | "search";

export interface ExternalLink {
  kind: LinkKind;
  label: string;
  domain?: string | null;
  note?: string | null;
  url: string;
}

/** What's available to show for a crag beyond the bare route list. Each
 * flag is a fact about whether an asset exists, resolved by slug via
 * lib/media.ts — never a duplicate copy of the asset's own metadata. */
export interface MediaAvailability {
  photos: boolean;
  panorama: boolean;
  model3d: boolean;
  topo: boolean;
}

export interface RegionSummary {
  id: string;
  slug: string;
  name: string;
  cragCount: number;
  routeCount: number;
  /** Site-internal canonical path, e.g. /explore/hohe-wand */
  path: string;
  links: ExternalLink[];
  moreInfoNote?: string | null;
}

export interface SectorSummary {
  id: string;
  slug: string;
  name: string;
  cragSlug: string;
  routeCount: number;
}

export interface CragSummary {
  id: string;
  slug: string;
  name: string;
  regionSlug: string;
  regionName: string;
  /** Site-internal canonical path, e.g. /explore/hohe-wand/hausstein */
  path: string;
  latitude: number | null;
  longitude: number | null;
  coordSource: string | null;
  routeCount: number;
  /** true when this crag has no transcribed routes yet — an OSM-only pin
   * that must still resolve to a real page (location, approach, links). */
  isStub: boolean;
  gradeSpan: { min: string; max: string } | null;
  disciplines: string[];
  links: ExternalLink[];
  hasExactLinks: boolean;
  media: MediaAvailability;
  distanceFromViennaKm: number | null;
}

export interface RouteCard {
  id: string;
  rowKey: string;
  slug: string;
  name: string;
  grade: string | null;
  gradeBand: string | null;
  gradeSystem: string | null;
  discipline: string;
  regionSlug: string;
  regionName: string;
  cragSlug: string;
  cragName: string;
  sectorId?: string | null;
  latitude: number | null;
  longitude: number | null;
  coordSource: string | null;
  source: string | null;
  /** e.g. "imported-unverified" — safety-relevant, must render as a badge
   * with the on-site-verification disclaimer wherever the route appears. */
  verificationStatus: string;
  provenance: string[];
  /** Deep link: /explore/<region>/<crag>#<id> */
  path: string;
}

export interface CragDetail extends CragSummary {
  routes: RouteCard[];
}

export interface RegionDetail extends RegionSummary {
  crags: CragSummary[];
}

/** Lightweight projection for client-side search — never the full route
 * record. Ships to the browser; keep it minimal (see build_api.py
 * search-index.json). */
export interface RouteSearchEntry {
  id: string;
  name: string;
  grade: string | null;
  regionSlug: string;
  regionName: string;
  cragSlug: string;
  cragName: string;
  path: string;
}

/**
 * Migration note (JSON → D1, not wired today): a RouteCard maps onto a
 * future `routes` D1 table keyed by `id` (already the deterministic UUID);
 * CragSummary maps onto `crags` keyed by `id`; verificationStatus /
 * provenance are exactly the columns `submissions.verification_source` and
 * `submissions.confidence` in db/schema.ts already anticipate. Contributor
 * submissions (db/schema.ts: submissions, submission_answers,
 * submission_files) attach to a `cragName`/`wallName` today and would
 * attach to `cragSlug` once this model lands in D1 — no schema change
 * needed, just a FK swap from name-matching to slug-matching.
 */
