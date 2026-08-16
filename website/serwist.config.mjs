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
    { url: "/explore-app", revision: "explore-app-v13" },
    { url: "/offline", revision: "offline-v1" },
    { url: "/explore-content.json", revision: `registry-v${registryRevision}` },
    ...atlasDataFiles.map((file) => ({ url: `/data/v1/${file}`, revision: atlasRevision })),
    { url: "/manifest.webmanifest", revision: "manifest-v2" },
    { url: "/icons/explore-app-192.png", revision: "icon-v1" },
    { url: "/icons/explore-app-512.png", revision: "icon-v1" },
    { url: "/icons/explore-app-maskable-512.png", revision: "icon-v1" },
    { url: "/vendor/leaflet/leaflet.js", revision: "leaflet-v1" },
    { url: "/vendor/leaflet/leaflet.css", revision: "leaflet-v1" },
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
