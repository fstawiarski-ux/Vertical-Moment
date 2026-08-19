import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { serwist } from "@serwist/next/config";

const atlasDataFiles = ["regions.json", "crags.json", "search-index.json", "stats.json", "facets.json"];
const atlasRevision = createHash("sha256")
  .update(Buffer.concat(await Promise.all(atlasDataFiles.map((file) => readFile(new URL(`./public/data/v1/${file}`, import.meta.url))))))
  .digest("hex")
  .slice(0, 16);
const registryRevision = createHash("sha256")
  .update(await readFile(new URL("./public/explore-content.json", import.meta.url)))
  .digest("hex")
  .slice(0, 16);
const pilotCatalog = JSON.parse(await readFile(new URL("./public/explore/pilots/index.json", import.meta.url), "utf8"));
const pilotFiles = [
  "explore/pilots/index.json",
  ...pilotCatalog.pilots.map((pilot) => pilot.manifest.replace(/^\//, "")),
];
const pilotPrecacheEntries = await Promise.all(pilotFiles.map(async (file) => ({
  url: `/${file}`,
  revision: createHash("sha256").update(await readFile(new URL(`./public/${file}`, import.meta.url))).digest("hex").slice(0, 16),
})));
const regionCatalog = JSON.parse(await readFile(new URL("./public/explore/regions/index.json", import.meta.url), "utf8"));
const regionFiles = [
  "explore/regions/index.json",
  ...regionCatalog.regions.map((region) => region.manifest.replace(/^\//, "")),
];
const regionPrecacheEntries = await Promise.all(regionFiles.map(async (file) => ({
  url: `/${file}`,
  revision: createHash("sha256").update(await readFile(new URL(`./public/${file}`, import.meta.url))).digest("hex").slice(0, 16),
})));

export default await serwist({
  swSrc: "src/pwa/service-worker.ts",
  swDest: "public/sw.js",
  precachePrerendered: false,
  globPatterns: [
    ".next/static/**/*.{js,css,html,ico,png,avif,webp,svg,json,webmanifest}",
  ],
  // These revisions are what tell an installed service worker that a precached
  // entry actually changed — matching url + revision is kept from the old cache
  // rather than refetched. Bump the app-shell and registry revisions with every
  // explore-content.json version bump, and the manifest revision whenever
  // manifest.webmanifest changes, or returning installs keep the old build.
  additionalPrecacheEntries: [
    { url: "/explore-app", revision: "explore-app-v14-brand-v2" },
    { url: "/explore-app/field", revision: "field-ops-shell-v1" },
    { url: "/offline", revision: "offline-v1" },
    { url: "/explore-content.json", revision: `registry-v${registryRevision}` },
    ...pilotPrecacheEntries,
    ...regionPrecacheEntries,
    ...atlasDataFiles.map((file) => ({ url: `/data/v1/${file}`, revision: atlasRevision })),
    { url: "/manifest.webmanifest", revision: "manifest-v3-brand-v2" },
    { url: "/brand/official-v2/icons/forest-180.png", revision: "official-brand-v2" },
    { url: "/brand/official-v2/icons/forest-192.png", revision: "official-brand-v2" },
    { url: "/brand/official-v2/icons/forest-512.png", revision: "official-brand-v2" },
    { url: "/brand/official-v2/marks/forest-green-vm.webp", revision: "official-brand-v2" },
    { url: "/brand/official-v2/marks/brushed-dark-silver-vm.webp", revision: "official-brand-v2" },
    { url: "/brand/official-v2/marks/iridescent-vm.webp", revision: "official-brand-v2" },
    { url: "/brand/official-v2/marks/gold-c-frame-cvm.webp", revision: "official-brand-v2" },
    { url: "/brand/official-v2/utility/vm-mono-white.svg", revision: "official-brand-v2" },
    { url: "/vendor/leaflet/leaflet.js", revision: "leaflet-v1" },
    { url: "/vendor/leaflet/leaflet.css", revision: "leaflet-v1" },
    { url: "/vendor/model-viewer/draco/draco_decoder.js", revision: "three-0.183.2" },
    { url: "/vendor/model-viewer/draco/draco_decoder.wasm", revision: "three-0.183.2" },
    { url: "/vendor/model-viewer/draco/draco_wasm_wrapper.js", revision: "three-0.183.2" },
  ],
  globIgnores: [
    "**/node_modules/**/*",
    "**/*.map",
    "**/server/**/*",
    "**/cache/**/*",
  ],
  maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
  esbuildOptions: {
    minify: true,
    target: "es2020",
  },
});
