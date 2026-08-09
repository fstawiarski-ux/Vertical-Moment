/**
 * Pure transforms: raw database/api/v1 JSON -> the canonical model in
 * climbing-types.ts. No filesystem or fetch here on purpose, so the exact
 * same code normalizes data whether it was read at build time (fs, for
 * generateStaticParams) or at request time in the browser (fetch, for the
 * interactive map) — one mapping, two callers, no drift between them.
 */
import type {
  CragSummary, RegionSummary, RouteCard, ExternalLink, MediaAvailability,
} from "./climbing-types";

const VIENNA: [number, number] = [48.2082, 16.3738];

export function distanceFromViennaKm(lat: number, lon: number): number {
  const R = 6371, r = Math.PI / 180;
  const dLat = (lat - VIENNA[0]) * r, dLon = (lon - VIENNA[1]) * r;
  return Math.round(
    2 * R * Math.asin(Math.sqrt(
      Math.sin(dLat / 2) ** 2 + Math.cos(VIENNA[0] * r) * Math.cos(lat * r) * Math.sin(dLon / 2) ** 2
    ))
  );
}

/** Rough UIAA-style ordering: leading number, +/- as a small offset, the
 * lower side of a "6+/7-" combined notation. Approximate by nature —
 * grading systems don't share one linear scale — good enough for a
 * min–max "grade span" summary, not for route-to-route comparison. */
function gradeSortKey(g: string): number {
  const primary = g.split("/")[0].trim();
  const m = primary.match(/^(\d+)\s*([+-]?)/);
  if (!m) return Number.POSITIVE_INFINITY;
  const base = parseInt(m[1], 10);
  const mod = m[2] === "+" ? 0.3 : m[2] === "-" ? -0.3 : 0;
  return base + mod;
}

export function gradeSpanFrom(grades: string[]): { min: string; max: string } | null {
  const valid = grades.filter(Boolean);
  if (!valid.length) return null;
  const sorted = [...valid].sort((a, b) => gradeSortKey(a) - gradeSortKey(b));
  return { min: sorted[0], max: sorted[sorted.length - 1] };
}

export interface RawExternalLink {
  kind: "exact" | "search";
  label: string;
  domain?: string | null;
  note?: string | null;
  url: string;
}

export interface RawRegion {
  id: string; name: string; slug: string;
  crag_count: number; route_count: number; path: string;
  links: RawExternalLink[]; more_info_note?: string | null;
}

export interface RawCrag {
  id: string; name: string; slug: string;
  region: string; region_slug: string;
  route_count: number; is_stub: boolean;
  latitude: number | null; longitude: number | null; coord_source: string | null;
  grades: string[]; disciplines: string[]; path: string;
  osm?: string | null; rock?: string | null; website?: string | null;
  topo?: string | null; wikimedia?: string | null;
  links: RawExternalLink[]; has_exact_links: boolean;
}

export interface RawRoute {
  id: string; row_key: string; slug: string; name: string;
  grade: string | null; grade_band: string | null; grade_system: string | null;
  discipline: string;
  region: string; region_slug: string;
  crag: string; crag_slug: string;
  latitude: number | null; longitude: number | null; coord_source: string | null;
  source: string | null;
  verification_status: string; provenance: string[];
  path: string;
}

/** Site-internal canonical path — deliberately NOT the api's own `path`
 * field (which addresses the /crags/... data endpoint, per
 * database/API_README.md). The page route lives at /explore/. */
export function regionPath(regionSlug: string): string {
  return `/explore/${regionSlug}`;
}
export function cragPath(regionSlug: string, cragSlug: string): string {
  return `/explore/${regionSlug}/${cragSlug}`;
}
export function routePath(regionSlug: string, cragSlug: string, routeId: string): string {
  return `${cragPath(regionSlug, cragSlug)}#${routeId}`;
}

function toExternalLink(raw: RawExternalLink): ExternalLink {
  return { kind: raw.kind, label: raw.label, domain: raw.domain ?? null, note: raw.note ?? null, url: raw.url };
}

export function toRegionSummary(raw: RawRegion): RegionSummary {
  return {
    id: raw.id, slug: raw.slug, name: raw.name,
    cragCount: raw.crag_count, routeCount: raw.route_count,
    path: regionPath(raw.slug),
    links: (raw.links || []).map(toExternalLink),
    moreInfoNote: raw.more_info_note ?? null,
  };
}

export function toCragSummary(raw: RawCrag, media: MediaAvailability): CragSummary {
  return {
    id: raw.id, slug: raw.slug, name: raw.name,
    regionSlug: raw.region_slug, regionName: raw.region,
    path: cragPath(raw.region_slug, raw.slug),
    latitude: raw.latitude, longitude: raw.longitude, coordSource: raw.coord_source,
    routeCount: raw.route_count, isStub: raw.is_stub,
    gradeSpan: gradeSpanFrom(raw.grades || []),
    disciplines: raw.disciplines || [],
    links: (raw.links || []).map(toExternalLink),
    hasExactLinks: raw.has_exact_links,
    media,
    distanceFromViennaKm: raw.latitude != null && raw.longitude != null
      ? distanceFromViennaKm(raw.latitude, raw.longitude) : null,
  };
}

export function toRouteCard(raw: RawRoute): RouteCard {
  return {
    id: raw.id, rowKey: raw.row_key, slug: raw.slug, name: raw.name,
    grade: raw.grade, gradeBand: raw.grade_band, gradeSystem: raw.grade_system,
    discipline: raw.discipline,
    regionSlug: raw.region_slug, regionName: raw.region,
    cragSlug: raw.crag_slug, cragName: raw.crag,
    latitude: raw.latitude, longitude: raw.longitude, coordSource: raw.coord_source,
    source: raw.source,
    verificationStatus: raw.verification_status, provenance: raw.provenance || [],
    path: routePath(raw.region_slug, raw.crag_slug, raw.id),
  };
}
