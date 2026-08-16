import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const websiteRoot = path.resolve(repoRoot, "website");
const errors = [];

async function filesUnder(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(absolute));
    else files.push(absolute);
  }
  return files;
}

const publicFiles = await filesUnder(path.join(websiteRoot, "public"));
const publicGpx = publicFiles.filter((file) => file.toLowerCase().endsWith(".gpx"));
if (publicGpx.length > 0) {
  errors.push(`public GPX files found: ${publicGpx.map((file) => path.relative(repoRoot, file)).join(", ")}`);
}

const atlasPath = path.join(websiteRoot, "app", "(platform)", "explore", "atlas-data.json");
const atlas = JSON.parse(await readFile(atlasPath, "utf8"));
if (atlas.walls.some((wall) => Object.hasOwn(wall, "gpx"))) {
  errors.push("generated atlas-data.json still exposes a gpx wall field");
}
if (Object.hasOwn(atlas.source, "gpxCount") || Object.hasOwn(atlas.source, "matchedGpxCount")) {
  errors.push("generated atlas-data.json still exposes GPX source counts");
}

const nextConfig = await readFile(path.join(websiteRoot, "next.config.mjs"), "utf8");
for (const directive of ["Content-Security-Policy", "default-src 'self'", "object-src 'none'", "frame-ancestors 'self'", "'wasm-unsafe-eval'"]) {
  if (!nextConfig.includes(directive)) errors.push(`PWA security policy is missing ${directive}`);
}

const manifest = JSON.parse(await readFile(path.join(websiteRoot, "public", "manifest.webmanifest"), "utf8"));
if (manifest.prefer_related_applications !== false) {
  errors.push("PWA manifest must explicitly remain independent of related app stores");
}

for (const root of [path.join(websiteRoot, "app"), path.join(websiteRoot, "src"), path.join(websiteRoot, "scripts")]) {
  for (const file of await filesUnder(root)) {
    if (!/\.(?:ts|tsx|mjs|js)$/.test(file)) continue;
    if (path.basename(file) === "verify-security-boundaries.mjs") continue;
    const source = await readFile(file, "utf8");
    if (source.includes("/atlas-gpx/")) {
      errors.push(`public GPX URL reference found in ${path.relative(repoRoot, file)}`);
    }
    if (source.includes("cdnjs.cloudflare.com")) {
      errors.push(`runtime CDN dependency found in ${path.relative(repoRoot, file)}`);
    }
  }
}

for (const file of await filesUnder(path.join(repoRoot, ".github", "workflows"))) {
  if (!/\.ya?ml$/.test(file)) continue;
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(/^\s*uses:\s*([^\s]+)@([^\s#]+)/gm)) {
    if (!/^[0-9a-f]{40}$/i.test(match[2])) {
      errors.push(`unpinned GitHub Action ${match[1]}@${match[2]} in ${path.relative(repoRoot, file)}`);
    }
  }
}

if (errors.length > 0) {
  console.error("verify-security: failed");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("verify-security: no public GPX files, no runtime GPX URLs, and all repository actions are pinned");
