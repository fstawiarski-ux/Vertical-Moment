import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");

const paths = {
  canonical: path.join(repoRoot, "database", "master", "vertical-moment-canonical.json"),
  apiRoutes: path.join(repoRoot, "database", "api", "v1", "routes.json"),
  apiCrags: path.join(repoRoot, "database", "api", "v1", "crags.json"),
  apiRegions: path.join(repoRoot, "database", "api", "v1", "regions.json"),
  mirrorRoutes: path.join(repoRoot, "website", "public", "data", "v1", "routes.json"),
  mirrorCrags: path.join(repoRoot, "website", "public", "data", "v1", "crags.json"),
  mirrorRegions: path.join(repoRoot, "website", "public", "data", "v1", "regions.json"),
  atlas: path.join(repoRoot, "website", "app", "(platform)", "explore", "atlas-data.json"),
};

async function load(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

const [canonical, apiRoutes, apiCrags, apiRegions, mirrorRoutes, mirrorCrags, mirrorRegions, atlas] =
  await Promise.all(Object.values(paths).map(load));

const failures = [];
const canonicalRoutes = canonical.routes ?? [];
const canonicalCrags = canonical.crags ?? [];
const canonicalRegions = canonical.regions ?? [];

function expectEqual(label, actual, expected) {
  if (actual !== expected) failures.push(`${label}: expected ${expected}, received ${actual}`);
}

function expectCount(label, document, property, expected) {
  const items = document[property] ?? [];
  expectEqual(`${label}.${property}.length`, items.length, expected);
  if (Object.hasOwn(document, "count")) expectEqual(`${label}.count`, document.count, expected);
}

function duplicateIds(label, items) {
  const ids = items.map((item) => item.id).filter(Boolean);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) failures.push(`${label}: duplicate IDs ${[...new Set(duplicates)].join(", ")}`);
}

expectEqual("canonical.counts.routes", canonical.counts.routes, canonicalRoutes.length);
expectEqual("canonical.counts.crags", canonical.counts.crags, canonicalCrags.length);
expectEqual("canonical.counts.regions", canonical.counts.regions, canonicalRegions.length);

expectCount("apiRoutes", apiRoutes, "routes", canonicalRoutes.length);
expectCount("apiCrags", apiCrags, "crags", canonicalCrags.length);
expectCount("apiRegions", apiRegions, "regions", canonicalRegions.length);
expectCount("mirrorRoutes", mirrorRoutes, "routes", canonicalRoutes.length);
expectCount("mirrorCrags", mirrorCrags, "crags", canonicalCrags.length);
expectCount("mirrorRegions", mirrorRegions, "regions", canonicalRegions.length);

expectEqual("atlas.routes.length", atlas.routes?.length ?? 0, canonicalRoutes.length);
expectEqual("atlas.walls.length", atlas.walls?.length ?? 0, canonicalCrags.length);
expectEqual("atlas.regions.length", atlas.regions?.length ?? 0, canonicalRegions.length);
expectEqual("atlas.source.routeCount", atlas.source?.routeCount, canonicalRoutes.length);
expectEqual("atlas.source.wallCount", atlas.source?.wallCount, canonicalCrags.length);
expectEqual("atlas.source.regionCount", atlas.source?.regionCount, canonicalRegions.length);

duplicateIds("canonical.routes", canonicalRoutes);
duplicateIds("apiRoutes.routes", apiRoutes.routes ?? []);
duplicateIds("mirrorRoutes.routes", mirrorRoutes.routes ?? []);
duplicateIds("atlas.routes", atlas.routes ?? []);

const canonicalIds = new Set(canonicalRoutes.map((route) => route.id));
for (const [label, items] of [
  ["apiRoutes", apiRoutes.routes ?? []],
  ["mirrorRoutes", mirrorRoutes.routes ?? []],
  ["atlas", atlas.routes ?? []],
]) {
  const missing = items.filter((route) => !canonicalIds.has(route.id));
  if (missing.length) failures.push(`${label}: ${missing.length} route IDs are absent from canonical JSON`);
}

console.log(
  `verify-canonical: ${canonicalRoutes.length} routes, ${canonicalCrags.length} crags, ${canonicalRegions.length} regions; API, mirror and atlas counts checked`,
);

if (failures.length) {
  console.error("verify-canonical: failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("verify-canonical: active source and generated consumers agree");
