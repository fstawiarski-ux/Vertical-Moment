import fs from "node:fs";
import path from "node:path";

const sourceArgument = process.argv[2] ?? process.env.VM_ATLAS_SOURCE;

if (!sourceArgument) {
  throw new Error(
    "Atlas source missing. Run: node scripts/import-review-atlas.mjs <path-to-atlas>",
  );
}

const sourceRoot = path.resolve(sourceArgument);
const raw = fs.readFileSync(path.join(sourceRoot, "data/atlas.js"), "utf8").trim();
const atlas = JSON.parse(raw.replace(/^const ATLAS = /, "").replace(/;$/, ""));

const normalize = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const gpxFiles = fs
  .readdirSync(path.join(sourceRoot, "gpx"))
  .filter((file) => file.toLowerCase().endsWith(".gpx"));

const gpxByKey = new Map(
  gpxFiles.map((file) => [normalize(file.replace(/\.gpx$/i, "")), file]),
);

const walls = atlas.walls.map((wall) => {
  const match = gpxByKey.get(normalize(`${wall.rg}__${wall.n}`));
  return {
    ...wall,
    gpx: match ? `/atlas-gpx/${encodeURIComponent(match)}` : null,
  };
});

const output = {
  generated: atlas.generated,
  regions: atlas.regions,
  walls,
  routes: atlas.routes,
  source: {
    label: "Vertical Moment review atlas",
    regionCount: atlas.regions.length,
    wallCount: atlas.walls.length,
    routeCount: atlas.routes.length,
    gpxCount: gpxFiles.length,
    matchedGpxCount: walls.filter((wall) => wall.gpx).length,
  },
};

const destination = path.resolve("app/(platform)/explore/atlas-data.json");
fs.writeFileSync(destination, `${JSON.stringify(output)}\n`, "utf8");
console.log(JSON.stringify(output.source, null, 2));
