import { serwist } from "@serwist/next/config";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read and normalize explore-app.html with BUILD_ID
const buildId = (await readFile(join(__dirname, ".next/BUILD_ID"), "utf8")).trim();
if (!buildId) {
  throw new Error("BUILD_ID is empty");
}

const exploreAppHtml = await readFile(join(__dirname, ".next/server/app/explore-app.html"), "utf8");

// Validate that BUILD_ID is found in HTML
if (!exploreAppHtml.includes(buildId)) {
  throw new Error(`BUILD_ID "${buildId}" not found in explore-app.html`);
}

// Normalize HTML by replacing BUILD_ID with marker
const normalizedHtml = exploreAppHtml.replaceAll(buildId, "<NEXT_BUILD_ID>");

// Generate SHA-256 hash
const exploreAppRevision = createHash("sha256").update(normalizedHtml).digest("hex");

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
    { url: "/explore-app", revision: `explore-app-${exploreAppRevision}` },
    { url: "/offline", revision: "offline-v1" },
    { url: "/explore-content.json", revision: "registry-v7" },
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
