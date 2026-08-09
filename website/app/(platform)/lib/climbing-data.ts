/**
 * Server-side reads of the synced database/api/v1 tree (see
 * scripts/sync-data.mjs — public/data/v1 is a verbatim copy, not a new
 * dataset). Used by generateStaticParams and server components for the
 * per-region/per-crag pages and the sitemap. The client map fetches the
 * same files at runtime — see climbing-client.ts.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { CragDetail, RegionDetail, RegionSummary, CragSummary } from "./climbing-types";
import {
  toRegionSummary, toCragSummary, toRouteCard,
  type RawRegion, type RawCrag, type RawRoute,
} from "./climbing-adapter";
import { mediaFor } from "./media";

const DATA_ROOT = path.join(process.cwd(), "public", "data", "v1");

function readJson<T>(...segments: string[]): T {
  return JSON.parse(readFileSync(path.join(DATA_ROOT, ...segments), "utf-8")) as T;
}

export function getAllRegions(): RegionSummary[] {
  const doc = readJson<{ regions: RawRegion[] }>("regions.json");
  return doc.regions.map(toRegionSummary).sort((a, b) => b.routeCount - a.routeCount);
}

export function getAllCrags(): CragSummary[] {
  const doc = readJson<{ crags: RawCrag[] }>("crags.json");
  return doc.crags.map(c => toCragSummary(c, mediaFor(c.name, (c.links || []).map(l => l))));
}

export function getRegionDetail(regionSlug: string): RegionDetail | null {
  let doc: { region: RawRegion; crags: RawCrag[] };
  try {
    doc = readJson("regions", `${regionSlug}.json`);
  } catch {
    return null;
  }
  const crags = doc.crags
    .map(c => toCragSummary(c, mediaFor(c.name, (c.links || []).map(l => l))))
    .sort((a, b) => b.routeCount - a.routeCount);
  return { ...toRegionSummary(doc.region), crags };
}

export function getCragDetail(regionSlug: string, cragSlug: string): CragDetail | null {
  let doc: { crag: RawCrag; routes: RawRoute[] };
  try {
    doc = readJson("crags", regionSlug, `${cragSlug}.json`);
  } catch {
    return null;
  }
  const media = mediaFor(doc.crag.name, (doc.crag.links || []).map(l => l));
  const routes = doc.routes
    .map(toRouteCard)
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  return { ...toCragSummary(doc.crag, media), routes };
}

export function getAllCragParams(): { region: string; crag: string }[] {
  const doc = readJson<{ crags: RawCrag[] }>("crags.json");
  return doc.crags.map(c => ({ region: c.region_slug, crag: c.slug }));
}

export function getAllRegionSlugs(): string[] {
  const doc = readJson<{ regions: RawRegion[] }>("regions.json");
  return doc.regions.map(r => r.slug);
}
