import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(here, "..");
const publicRoot = path.join(websiteRoot, "public");
const pilotsRoot = path.join(publicRoot, "explore", "pilots");
const regionsRoot = path.join(publicRoot, "explore", "regions");
const catalog = JSON.parse(await readFile(path.join(pilotsRoot, "index.json"), "utf8"));
const failures = [];
const assetKeys = ["hero", "spatial", "topo", "model", "panoramaPoster", "panorama360", "scrubRegionRock", "scrubRockSector", "scrubSectorTopo"];
const moduleKeys = ["locator", "panorama", "routes", "wall", "topo"];
const statuses = new Set(["missing", "review", "ready"]);
const kinds = new Set(["image", "video", "model", "panorama", "link"]);
const ids = new Set();
let previewAdapterCount = 0;

function requiredString(label, value) {
  if (typeof value !== "string" || !value.trim()) failures.push(`${label}: required non-empty string`);
}

function publicFileFor(src) {
  if (typeof src !== "string" || !src.startsWith("/") || src.startsWith("//")) return null;
  return path.join(publicRoot, ...src.slice(1).split("/"));
}

async function resolvedAssetSize(assetFile, details) {
  if (details.size > 256) return details.size;
  const contents = await readFile(assetFile, "utf8");
  const lfsSize = contents.match(/^version https:\/\/git-lfs\.github\.com\/spec\/v1\r?\n(?:oid sha256:[a-f0-9]{64}\r?\n)size (\d+)\r?\n?$/)?.[1];
  return lfsSize ? Number(lfsSize) : details.size;
}

if (catalog.schemaVersion !== 1) failures.push("index.schemaVersion: expected 1");
if (!Array.isArray(catalog.pilots) || !catalog.pilots.length) failures.push("index.pilots: at least one pilot is required");

for (const [catalogIndex, entry] of (catalog.pilots ?? []).entries()) {
  const entryLabel = `index.pilots[${catalogIndex}]`;
  for (const key of ["id", "cragSlug", "manifest", "releaseState"]) requiredString(`${entryLabel}.${key}`, entry[key]);
  if (ids.has(entry.id)) failures.push(`${entryLabel}.id: duplicate ${entry.id}`);
  ids.add(entry.id);
  const manifestFile = publicFileFor(entry.manifest);
  if (!manifestFile) {
    failures.push(`${entryLabel}.manifest: must be a same-origin public path`);
    continue;
  }

  let pilot;
  try {
    pilot = JSON.parse(await readFile(manifestFile, "utf8"));
  } catch (error) {
    failures.push(`${entryLabel}.manifest: cannot read ${entry.manifest} (${error instanceof Error ? error.message : "unknown error"})`);
    continue;
  }

  const label = `pilot:${entry.id}`;
  if (pilot.schemaVersion !== 1) failures.push(`${label}.schemaVersion: expected 1`);
  if (pilot.id !== entry.id) failures.push(`${label}.id: does not match catalog`);
  if (pilot.identity?.cragSlug !== entry.cragSlug) failures.push(`${label}.identity.cragSlug: does not match catalog`);
  if (pilot.releaseState !== entry.releaseState) failures.push(`${label}.releaseState: does not match catalog`);
  for (const key of ["label", "id"]) requiredString(`${label}.${key}`, pilot[key]);
  for (const key of ["region", "regionSlug", "crag", "cragSlug"]) requiredString(`${label}.identity.${key}`, pilot.identity?.[key]);
  if (!Number.isInteger(pilot.summary?.routeCount) && pilot.summary?.routeCount !== null) failures.push(`${label}.summary.routeCount: expected non-negative integer or null`);
  if (!assetKeys.includes(pilot.journey?.posterSlot)) failures.push(`${label}.journey.posterSlot: unknown asset slot`);
  if (!Array.isArray(pilot.journey?.chapters) || pilot.journey.chapters.length !== 3) failures.push(`${label}.journey.chapters: exactly three chapters required`);
  for (const [chapterIndex, chapter] of (pilot.journey?.chapters ?? []).entries()) {
    const chapterLabel = `${label}.journey.chapters[${chapterIndex}]`;
    if (!assetKeys.includes(chapter.asset)) failures.push(`${chapterLabel}.asset: unknown ${chapter.asset}`);
    if (pilot.assets?.[chapter.asset]?.kind !== "video") failures.push(`${chapterLabel}.asset: must reference a video slot`);
    if (pilot.assets?.[chapter.asset]?.status === "ready" && !(typeof chapter.duration === "number" && chapter.duration > 0)) failures.push(`${chapterLabel}.duration: ready scrub videos require a positive duration`);
  }

  for (const moduleKey of moduleKeys) {
    const module = pilot.modules?.[moduleKey];
    if (!module) {
      failures.push(`${label}.modules.${moduleKey}: required module`);
      continue;
    }
    for (const key of ["title", "mobileLabel", "description"]) requiredString(`${label}.modules.${moduleKey}.${key}`, module[key]);
    if (!Array.isArray(module.primarySlots)) failures.push(`${label}.modules.${moduleKey}.primarySlots: required array`);
    for (const slotKey of module.primarySlots ?? []) if (!assetKeys.includes(slotKey)) failures.push(`${label}.modules.${moduleKey}.primarySlots: unknown ${slotKey}`);
  }

  for (const assetKey of assetKeys) {
    const slot = pilot.assets?.[assetKey];
    const slotLabel = `${label}.assets.${assetKey}`;
    if (!slot) {
      failures.push(`${slotLabel}: required slot`);
      continue;
    }
    if (!kinds.has(slot.kind)) failures.push(`${slotLabel}.kind: unsupported ${slot.kind}`);
    if (!statuses.has(slot.status)) failures.push(`${slotLabel}.status: unsupported ${slot.status}`);
    for (const key of ["targetPath", "alt"]) requiredString(`${slotLabel}.${key}`, slot[key]);
    if (!slot.targetPath?.startsWith(`/explore/pilots/${pilot.id}/`)) failures.push(`${slotLabel}.targetPath: must live under this pilot folder`);
    if (slot.status !== "ready" && slot.src !== null) failures.push(`${slotLabel}.src: must stay null until status is ready`);
    if (slot.status === "ready") {
      requiredString(`${slotLabel}.src`, slot.src);
      if (slot.kind === "model" && (!Number.isInteger(slot.bytes) || slot.bytes <= 0)) failures.push(`${slotLabel}.bytes: ready models require a positive byte count`);
      const assetFile = publicFileFor(slot.src);
      if (assetFile) {
        try {
          const details = await stat(assetFile);
          if (!details.isFile() || details.size === 0) failures.push(`${slotLabel}.src: missing or empty ${slot.src}`);
          const assetSize = await resolvedAssetSize(assetFile, details);
          if (slot.bytes && slot.bytes !== assetSize) failures.push(`${slotLabel}.bytes: expected ${assetSize}, found ${slot.bytes}`);
        } catch {
          failures.push(`${slotLabel}.src: missing public asset ${slot.src}`);
        }
      } else if (!/^https:\/\//.test(slot.src ?? "")) {
        failures.push(`${slotLabel}.src: media must use a same-origin path or https URL`);
      }
    }
    if (slot.preview) {
      previewAdapterCount += 1;
      if (!new Set(["same-origin", "hosted"]).has(slot.preview.adapter)) failures.push(`${slotLabel}.preview.adapter: unsupported ${slot.preview.adapter}`);
      if (slot.preview.verifiedForPilot !== false) failures.push(`${slotLabel}.preview.verifiedForPilot: preview media must remain false`);
      if (slot.preview.replaceable !== true) failures.push(`${slotLabel}.preview.replaceable: expected true`);
      requiredString(`${slotLabel}.preview.provenance`, slot.preview.provenance);
      requiredString(`${slotLabel}.preview.src`, slot.preview.src);
      const previewFile = publicFileFor(slot.preview.src);
      if (slot.preview.adapter === "same-origin") {
        if (!previewFile) {
          failures.push(`${slotLabel}.preview.src: same-origin adapter requires a public path`);
        } else {
          try {
            const details = await stat(previewFile);
            if (!details.isFile() || details.size === 0) failures.push(`${slotLabel}.preview.src: missing or empty ${slot.preview.src}`);
          } catch {
            failures.push(`${slotLabel}.preview.src: missing public asset ${slot.preview.src}`);
          }
        }
      } else if (!/^https:\/\//.test(slot.preview.src ?? "")) {
        failures.push(`${slotLabel}.preview.src: hosted adapter requires https`);
      }
    }
  }
}

if (!ids.has(catalog.defaultPilot)) failures.push(`index.defaultPilot: unknown pilot ${catalog.defaultPilot}`);

let regionCount = 0;
let regionNodeCount = 0;
try {
  const regionCatalog = JSON.parse(await readFile(path.join(regionsRoot, "index.json"), "utf8"));
  if (regionCatalog.schemaVersion !== 1) failures.push("regions.index.schemaVersion: expected 1");
  const regionIds = new Set();
  for (const [regionIndex, entry] of (regionCatalog.regions ?? []).entries()) {
    const entryLabel = `regions.index.regions[${regionIndex}]`;
    requiredString(`${entryLabel}.id`, entry.id);
    requiredString(`${entryLabel}.manifest`, entry.manifest);
    if (regionIds.has(entry.id)) failures.push(`${entryLabel}.id: duplicate ${entry.id}`);
    regionIds.add(entry.id);
    const manifestFile = publicFileFor(entry.manifest);
    if (!manifestFile) {
      failures.push(`${entryLabel}.manifest: must be a same-origin public path`);
      continue;
    }
    let region;
    try {
      region = JSON.parse(await readFile(manifestFile, "utf8"));
    } catch (error) {
      failures.push(`${entryLabel}.manifest: cannot read ${entry.manifest} (${error instanceof Error ? error.message : "unknown error"})`);
      continue;
    }
    regionCount += 1;
    const label = `region:${entry.id}`;
    if (region.schemaVersion !== 1) failures.push(`${label}.schemaVersion: expected 1`);
    if (region.id !== entry.id) failures.push(`${label}.id: does not match catalog`);
    if (region.releaseState !== "private-preview") failures.push(`${label}.releaseState: expected private-preview`);
    for (const key of ["label", "eyebrow", "summary", "defaultNode", "notionUrl"]) requiredString(`${label}.${key}`, region[key]);
    const nodeIds = new Set();
    for (const [nodeIndex, node] of (region.nodes ?? []).entries()) {
      regionNodeCount += 1;
      const nodeLabel = `${label}.nodes[${nodeIndex}]`;
      for (const key of ["id", "label", "shortLabel", "role", "relationship"]) requiredString(`${nodeLabel}.${key}`, node[key]);
      if (nodeIds.has(node.id)) failures.push(`${nodeLabel}.id: duplicate ${node.id}`);
      nodeIds.add(node.id);
      if (node.pilotId !== null && !ids.has(node.pilotId)) failures.push(`${nodeLabel}.pilotId: unknown ${node.pilotId}`);
      if (!Number.isFinite(node.coordinate?.latitude) || !Number.isFinite(node.coordinate?.longitude)) failures.push(`${nodeLabel}.coordinate: numeric latitude and longitude required`);
      for (const key of ["state", "availability", "label", "poster", "note"]) requiredString(`${nodeLabel}.media.${key}`, node.media?.[key]);
      for (const mediaKey of ["poster", "video"]) {
        const src = node.media?.[mediaKey];
        if (src === null && mediaKey === "video") continue;
        const assetFile = publicFileFor(src);
        if (assetFile) {
          try {
            const details = await stat(assetFile);
            if (!details.isFile() || details.size === 0) failures.push(`${nodeLabel}.media.${mediaKey}: missing or empty ${src}`);
          } catch {
            failures.push(`${nodeLabel}.media.${mediaKey}: missing public asset ${src}`);
          }
        } else if (!/^https:\/\//.test(src ?? "")) {
          failures.push(`${nodeLabel}.media.${mediaKey}: must use a same-origin path or https URL`);
        }
      }
      if (node.media?.video && !(typeof node.media.duration === "number" && node.media.duration > 0)) failures.push(`${nodeLabel}.media.duration: video requires a positive duration`);
    }
    if (!nodeIds.has(region.defaultNode)) failures.push(`${label}.defaultNode: unknown node ${region.defaultNode}`);
  }
} catch (error) {
  failures.push(`regions.index: cannot read (${error instanceof Error ? error.message : "unknown error"})`);
}

console.log(`verify-pilots: ${ids.size} pilot manifests, ${ids.size * assetKeys.length} asset slots, ${previewAdapterCount} private preview adapters, ${regionCount} regional manifests, and ${regionNodeCount} regional nodes inspected`);

if (failures.length) {
  console.error("verify-pilots: failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("verify-pilots: catalog, manifests, and ready asset paths are valid");
