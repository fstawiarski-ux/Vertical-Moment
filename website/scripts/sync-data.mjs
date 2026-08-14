// Copies database/api/v1 (generated, never hand-edited) into
// website/public/data/v1 so the SAME files are reachable both at build time
// (fs, for generateStaticParams) and at runtime (fetch, for the client map).
// This does not transform or duplicate the dataset — it's a verbatim copy
// so one generated tree can serve two consumers. Run before dev/build.
import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, "..", "..", "database", "api", "v1");
const dest = path.resolve(here, "..", "public", "data", "v1");
const atlasBridge = path.resolve(here, "..", "app", "(platform)", "explore", "atlas-data.json");

function countBy(items, key) {
  const counts = new Map();
  for (const item of items) counts.set(item[key], (counts.get(item[key]) ?? 0) + 1);
  return counts;
}

function makeAtlasBridge({ generated, regions, crags, routes }) {
  const routesByRegion = countBy(routes, "region_slug");
  const routesByCrag = new Map();
  for (const route of routes) {
    const key = `${route.region_slug}/${route.crag_slug}`;
    routesByCrag.set(key, [...(routesByCrag.get(key) ?? []), route]);
  }

  const regionsOut = regions.map((region) => {
    const regionRoutes = routes.filter((route) => route.region_slug === region.slug);
    const coordinate = regionRoutes.find((route) => route.latitude != null && route.longitude != null);
    const firstCrag = crags.find((crag) => crag.region_slug === region.slug && crag.latitude != null && crag.longitude != null);
    return {
      n: region.name,
      slug: region.slug,
      ct: routesByRegion.get(region.slug) ?? 0,
      ok: regionRoutes.filter((route) => route.latitude != null && route.longitude != null).length,
      tbf: regionRoutes.filter((route) => route.latitude == null || route.longitude == null).length,
      lat: coordinate?.latitude ?? firstCrag?.latitude ?? 47.94,
      lon: coordinate?.longitude ?? firstCrag?.longitude ?? 16.08,
      path: `/explore/${region.slug}`,
    };
  });

  const wallsOut = crags.map((crag) => {
    const cragRoutes = routesByCrag.get(`${crag.region_slug}/${crag.slug}`) ?? [];
    return {
      id: crag.id,
      n: crag.name,
      rg: crag.region,
      regionSlug: crag.region_slug,
      slug: crag.slug,
      ct: cragRoutes.length,
      ok: cragRoutes.filter((route) => route.latitude != null && route.longitude != null).length,
      tbf: cragRoutes.filter((route) => route.latitude == null || route.longitude == null).length,
      lat: crag.latitude,
      lon: crag.longitude,
      gr: crag.grades ?? [],
      path: `/explore/${crag.region_slug}/${crag.slug}`,
    };
  });

  const routesOut = routes.map((route) => ({
    id: route.id,
    n: route.name,
    g: route.grade ?? "",
    b: route.grade_band ?? "",
    rg: route.region,
    regionSlug: route.region_slug,
    w: route.crag,
    wallSlug: route.crag_slug,
    src: route.source ?? "",
    st: route.latitude != null && route.longitude != null ? 1 : 0,
    lat: route.latitude,
    lon: route.longitude,
    path: `/explore/${route.region_slug}/${route.crag_slug}#${route.id}`,
  }));

  return {
    generated: generated ?? new Date().toISOString().slice(0, 10),
    regions: regionsOut,
    walls: wallsOut,
    routes: routesOut,
    source: {
      label: "Vertical Moment canonical database/api/v1",
      regionCount: regionsOut.length,
      wallCount: wallsOut.length,
      routeCount: routesOut.length,
    },
  };
}

async function main() {
  try {
    await stat(src);
  } catch {
    console.error(`sync-data: source not found at ${src}`);
    console.error("Run 'python database/scripts/build_api.py' first.");
    process.exit(1);
  }
  await rm(dest, { recursive: true, force: true });
  await cp(src, dest, { recursive: true });
  const [regionsDoc, cragsDoc, routesDoc] = await Promise.all([
    readFile(path.join(src, "regions.json"), "utf8"),
    readFile(path.join(src, "crags.json"), "utf8"),
    readFile(path.join(src, "routes.json"), "utf8"),
  ]);
  const regionsJson = JSON.parse(regionsDoc);
  const cragsJson = JSON.parse(cragsDoc);
  const routesJson = JSON.parse(routesDoc);
  const atlas = makeAtlasBridge({
    generated: regionsJson.generated?.slice(0, 10),
    regions: regionsJson.regions,
    crags: cragsJson.crags,
    routes: routesJson.routes,
  });
  await mkdir(path.dirname(atlasBridge), { recursive: true });
  await writeFile(atlasBridge, `${JSON.stringify(atlas)}\n`, "utf8");
  console.log(`sync-data: ${src} -> ${dest}`);
  console.log(`sync-data: generated canonical atlas bridge -> ${atlasBridge}`);
}

main();
