import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(here, "..");
const registryPath = path.join(websiteRoot, "public", "explore-content.json");

const supportedBoxTypes = new Set([
  "gallery",
  "spatial",
  "panorama",
  "note",
  "model3d",
  "atlas",
  "nasenwand",
  "wallreveal",
  "info",
]);

const registry = JSON.parse(await readFile(registryPath, "utf8"));
const failures = [];
const assetPaths = new Set();

function requiredString(label, value) {
  if (typeof value !== "string" || !value.trim()) failures.push(`${label}: required non-empty string`);
}

function requiredPositiveNumber(label, value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    failures.push(`${label}: required positive number`);
  }
}

function requiredNonNegativeNumber(label, value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    failures.push(`${label}: required non-negative number`);
  }
}

function collectAsset(label, value) {
  requiredString(label, value);
  if (typeof value === "string" && value.startsWith("/")) assetPaths.add(value);
  else if (typeof value === "string" && value.trim()) failures.push(`${label}: must be same-origin absolute path`);
}

function collectSrcSet(label, srcSet) {
  requiredString(label, srcSet);
  if (typeof srcSet !== "string") return;
  for (const [index, entry] of srcSet.split(",").map((part) => part.trim()).filter(Boolean).entries()) {
    collectAsset(`${label} asset ${index}`, entry.split(/\s+/)[0]);
  }
}

function validateImage(label, image) {
  if (!image || typeof image !== "object") {
    failures.push(`${label}: image metadata is required`);
    return;
  }
  collectAsset(`${label}.src`, image.src);
  requiredString(`${label}.alt`, image.alt);
  requiredPositiveNumber(`${label}.width`, image.width);
  requiredPositiveNumber(`${label}.height`, image.height);
  requiredString(`${label}.sizes`, image.sizes);
  for (const [index, source] of (image.sources ?? []).entries()) {
    requiredString(`${label}.sources[${index}].type`, source.type);
    collectSrcSet(`${label}.sources[${index}].srcSet`, source.srcSet);
  }
}

function validateLayout(label, layout) {
  if (!layout || typeof layout !== "object") {
    failures.push(`${label}: initialLayout is required`);
    return;
  }
  for (const key of ["x", "y"]) requiredNonNegativeNumber(`${label}.${key}`, layout[key]);
  for (const key of ["width", "height"]) requiredPositiveNumber(`${label}.${key}`, layout[key]);
}

requiredPositiveNumber("version", registry.version);
requiredString("updatedAt", registry.updatedAt);
validateImage("background", registry.background);

const scrub = registry.introScrubSequence;
if (!scrub || typeof scrub !== "object") failures.push("introScrubSequence: required object");
else {
  collectAsset("introScrubSequence.poster", scrub.poster);
  if (!Array.isArray(scrub.chapters) || scrub.chapters.length === 0) failures.push("introScrubSequence.chapters: at least one chapter required");
  for (const [index, chapter] of (scrub.chapters ?? []).entries()) {
    const label = `introScrubSequence.chapters[${index}]`;
    for (const key of ["id", "from", "to", "alt", "direction"]) requiredString(`${label}.${key}`, chapter[key]);
    collectAsset(`${label}.video`, chapter.video);
    requiredPositiveNumber(`${label}.duration`, chapter.duration);
  }
}

if (!Array.isArray(registry.boxes) || registry.boxes.length === 0) failures.push("boxes: at least one content box required");
const boxIds = new Set();
for (const [index, box] of (registry.boxes ?? []).entries()) {
  const label = `boxes[${index}]`;
  for (const key of ["id", "title", "region", "crag", "description"]) requiredString(`${label}.${key}`, box[key]);
  if (boxIds.has(box.id)) failures.push(`${label}.id: duplicate ${box.id}`);
  boxIds.add(box.id);
  if (!supportedBoxTypes.has(box.type)) failures.push(`${label}.type: unsupported ${box.type}`);
  validateLayout(label, box.initialLayout);
  if (box.image) validateImage(`${label}.image`, box.image);
  if (box.model) {
    collectAsset(`${label}.model.src`, box.model.src);
    requiredPositiveNumber(`${label}.model.bytes`, box.model.bytes);
  }
}

for (const field of ["offlineData", "offlinePack", "heavyAssets"]) {
  if (!Array.isArray(registry[field])) failures.push(`${field}: required array`);
  for (const [index, asset] of (registry[field] ?? []).entries()) collectAsset(`${field}[${index}]`, asset);
}

for (const asset of assetPaths) {
  const filePath = path.join(websiteRoot, "public", asset.slice(1));
  try {
    const details = await stat(filePath);
    if (!details.isFile() || details.size === 0) failures.push(`${asset}: missing or empty public asset`);
  } catch {
    failures.push(`${asset}: missing public asset`);
  }
}

console.log(`verify-pwa-content: ${boxIds.size} boxes and ${assetPaths.size} referenced assets inspected`);

if (failures.length) {
  console.error("verify-pwa-content: failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("verify-pwa-content: registry fields and referenced assets are valid");
