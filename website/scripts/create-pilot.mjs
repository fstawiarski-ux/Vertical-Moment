import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pilotId = process.argv[2];
if (!pilotId || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pilotId)) {
  console.error("Usage: npm run pilot:new -- <lowercase-pilot-id>");
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const pilotsRoot = path.resolve(here, "..", "public", "explore", "pilots");
const templateRoot = path.join(pilotsRoot, "_template");
const destination = path.join(pilotsRoot, pilotId);
const catalogPath = path.join(pilotsRoot, "index.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));

if (catalog.pilots.some((entry) => entry.id === pilotId)) {
  console.error(`Pilot ${pilotId} already exists in the catalog.`);
  process.exit(1);
}

await mkdir(destination, { recursive: false });
await cp(templateRoot, destination, { recursive: true, errorOnExist: true });
const manifestPath = path.join(destination, "pilot.json");
const manifest = JSON.parse((await readFile(manifestPath, "utf8")).replaceAll("pilot-id", pilotId));
manifest.id = pilotId;
manifest.label = `Pilot — ${pilotId}`;
manifest.identity.cragSlug = pilotId;
manifest.identity.crag = pilotId.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

catalog.pilots.push({ id: pilotId, cragSlug: manifest.identity.cragSlug, manifest: `/explore/pilots/${pilotId}/pilot.json`, releaseState: "assembly" });
await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

console.log(`Created ${path.relative(process.cwd(), destination)}`);
console.log("Next: fill identity/provenance, leave absent assets as status=missing + src=null, then run npm run verify-pilots.");
