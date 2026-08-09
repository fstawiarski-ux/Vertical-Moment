"use client";

/**
 * Browser-side loaders for the interactive map. Fetches the SAME synced
 * files climbing-data.ts reads at build time (public/data/v1/), never
 * routes.json in bulk — regions.json and crags.json are small enough to
 * load up front; region/crag detail loads per view as the visitor drills
 * in; search-index.json loads lazily on first search keystroke.
 */
import type { CragDetail, CragSummary, RegionDetail, RegionSummary, RouteSearchEntry } from "./climbing-types";
import { toRegionSummary, toCragSummary, toRouteCard, routePath, type RawRegion, type RawCrag, type RawRoute } from "./climbing-adapter";
import { mediaFor } from "./media";

const cache = new Map<string, Promise<unknown>>();

function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) cache.set(key, fetcher());
  return cache.get(key) as Promise<T>;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export function fetchRegions(): Promise<RegionSummary[]> {
  return cached("regions", async () => {
    const doc = await getJson<{ regions: RawRegion[] }>("/data/v1/regions.json");
    return doc.regions.map(toRegionSummary).sort((a, b) => b.routeCount - a.routeCount);
  });
}

export function fetchAllCrags(): Promise<CragSummary[]> {
  return cached("crags", async () => {
    const doc = await getJson<{ crags: RawCrag[] }>("/data/v1/crags.json");
    return doc.crags.map(c => toCragSummary(c, mediaFor(c.name, c.links || [])));
  });
}

export function fetchRegionDetail(regionSlug: string): Promise<RegionDetail> {
  return cached(`region:${regionSlug}`, async () => {
    const doc = await getJson<{ region: RawRegion; crags: RawCrag[] }>(`/data/v1/regions/${regionSlug}.json`);
    const crags = doc.crags
      .map(c => toCragSummary(c, mediaFor(c.name, c.links || [])))
      .sort((a, b) => b.routeCount - a.routeCount);
    return { ...toRegionSummary(doc.region), crags };
  });
}

export function fetchCragDetail(regionSlug: string, cragSlug: string): Promise<CragDetail> {
  return cached(`crag:${regionSlug}/${cragSlug}`, async () => {
    const doc = await getJson<{ crag: RawCrag; routes: RawRoute[] }>(`/data/v1/crags/${regionSlug}/${cragSlug}.json`);
    const media = mediaFor(doc.crag.name, doc.crag.links || []);
    const routes = doc.routes.map(toRouteCard).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return { ...toCragSummary(doc.crag, media), routes };
  });
}

export function fetchSearchIndex(): Promise<RouteSearchEntry[]> {
  return cached("search-index", async () => {
    const doc = await getJson<{ routes: { id: string; name: string; grade: string | null; region: string; region_slug: string; crag: string; crag_slug: string; path: string }[] }>("/data/v1/search-index.json");
    return doc.routes.map(r => ({
      id: r.id, name: r.name, grade: r.grade,
      regionSlug: r.region_slug, regionName: r.region,
      cragSlug: r.crag_slug, cragName: r.crag,
      path: routePath(r.region_slug, r.crag_slug, r.id),
    }));
  });
}
