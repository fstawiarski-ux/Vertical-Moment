/**
 * Server-side access to the synced database/api/v1 tree (see
 * scripts/sync-data.mjs — public/data/v1 is a verbatim copy, not a new
 * dataset). Used by generateStaticParams and server components for the
 * per-region/per-crag pages and the sitemap. Static imports make the server
 * copy part of the OpenNext Worker bundle; public/data/v1 remains available
 * through Cloudflare's asset binding for climbing-client.ts. Workers cannot
 * read public/ with node:fs at request time.
 */
import regionsData from "../../../public/data/v1/regions.json";
import cragsData from "../../../public/data/v1/crags.json";
import routesData from "../../../public/data/v1/routes.json";
import type { CragDetail, RegionDetail, RegionSummary, CragSummary } from "./climbing-types";
import {
  toRegionSummary, toCragSummary, toRouteCard,
  type RawRegion, type RawCrag, type RawRoute,
} from "./climbing-adapter";
import { mediaFor } from "./media";

const rawRegions = (regionsData as unknown as { regions: RawRegion[] }).regions;
const rawCrags = (cragsData as unknown as { crags: RawCrag[] }).crags;
const rawRoutes = (routesData as unknown as { routes: RawRoute[] }).routes;

const regionsBySlug = new Map(rawRegions.map(region => [region.slug, region]));
const cragsByKey = new Map(rawCrags.map(crag => [`${crag.region_slug}/${crag.slug}`, crag]));
const cragsByRegion = new Map<string, RawCrag[]>();
const routesByCrag = new Map<string, RawRoute[]>();

for (const crag of rawCrags) {
  const regionCrags = cragsByRegion.get(crag.region_slug) ?? [];
  regionCrags.push(crag);
  cragsByRegion.set(crag.region_slug, regionCrags);
}

for (const route of rawRoutes) {
  const key = `${route.region_slug}/${route.crag_slug}`;
  const cragRoutes = routesByCrag.get(key) ?? [];
  cragRoutes.push(route);
  routesByCrag.set(key, cragRoutes);
}

export function getAllRegions(): RegionSummary[] {
  return rawRegions.map(toRegionSummary).sort((a, b) => b.routeCount - a.routeCount);
}

export function getAllCrags(): CragSummary[] {
  return rawCrags.map(c => toCragSummary(c, mediaFor(c.name, (c.links || []).map(l => l))));
}

export function getRegionDetail(regionSlug: string): RegionDetail | null {
  const region = regionsBySlug.get(regionSlug);
  if (!region) return null;
  const crags = (cragsByRegion.get(regionSlug) ?? [])
    .map(c => toCragSummary(c, mediaFor(c.name, (c.links || []).map(l => l))))
    .sort((a, b) => b.routeCount - a.routeCount);
  return { ...toRegionSummary(region), crags };
}

export function getCragDetail(regionSlug: string, cragSlug: string): CragDetail | null {
  const key = `${regionSlug}/${cragSlug}`;
  const crag = cragsByKey.get(key);
  if (!crag) return null;
  const media = mediaFor(crag.name, (crag.links || []).map(l => l));
  const routes = (routesByCrag.get(key) ?? [])
    .map(toRouteCard)
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  return { ...toCragSummary(crag, media), routes };
}

export function getAllCragParams(): { region: string; crag: string }[] {
  return rawCrags.map(c => ({ region: c.region_slug, crag: c.slug }));
}

export function getAllRegionSlugs(): string[] {
  return rawRegions.map(r => r.slug);
}
