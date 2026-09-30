const PREVIEW_PAGE_PATHS = new Set([
  "/explore-app",
  "/explore-app/planner",
  "/explore-app/planner.html",
  "/contribute",
  "/report",
  "/offline",
]);

const PREVIEW_PAGE_ROOTS = ["/explore", "/panoramas"];

const PREVIEW_RESOURCE_PATHS = new Set([
  "/sw.js",
  "/manifest.webmanifest",
  "/explore-content.json",
  "/photography/nasenwand/nasenwand-photo-1280.webp",
  "/photography/nasenwand/nasenwand-spatial-1280.webp",
  "/photography/nasenwand/nasenwand-topo-1280.webp",
]);

const PREVIEW_RESOURCE_ROOTS = [
  "/_next/static",
  "/data/v1",
  "/explore",
  "/photography/explore-app",
  "/photography/nasenwand/media",
  "/photography/panoramas",
  "/models",
  "/brand/official-v2/icons",
  "/brand/official-v2/marks",
  "/brand/official-v2/utility",
  "/vendor/leaflet",
  "/vendor/model-viewer",
];

const PREVIEW_IMAGE_PATHS = new Set([
  "/photography/nasenwand/nasenwand-photo-1280.webp",
  "/photography/nasenwand/nasenwand-spatial-1280.webp",
  "/photography/nasenwand/nasenwand-topo-1280.webp",
]);

const PREVIEW_IMAGE_ROOTS = [
  "/photography/explore-app",
  "/photography/nasenwand/media",
  "/photography/panoramas",
  "/explore/pilots",
  "/models",
  "/brand/official-v2/icons",
  "/brand/official-v2/marks",
  "/brand/official-v2/utility",
];

const SITE_ORIGIN = "https://verticalmoment.com";

function normalizePathname(pathname: string): string {
  if (pathname.length <= 1) return pathname;
  return pathname.replace(/\/+$/, "");
}

function isWithinPath(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`);
}

function isPreviewImageSource(source: string): boolean {
  try {
    const url = new URL(source, SITE_ORIGIN);
    if (url.origin !== SITE_ORIGIN) return false;
    const pathname = normalizePathname(url.pathname);
    return PREVIEW_IMAGE_PATHS.has(pathname)
      || PREVIEW_IMAGE_ROOTS.some((root) => isWithinPath(pathname, root));
  } catch {
    return false;
  }
}

/**
 * The PWA is an unlisted, noindex preview, not an authentication boundary.
 * Its application routes and only the resources they use pass the maintenance
 * gate; all public-site pages continue to receive the 503 response.
 */
export function isPwaPreviewRequest(pathname: string, search = ""): boolean {
  const normalizedPath = normalizePathname(pathname);

  if (PREVIEW_PAGE_PATHS.has(normalizedPath)) return true;
  if (PREVIEW_PAGE_ROOTS.some((root) => isWithinPath(normalizedPath, root))) return true;

  if (PREVIEW_RESOURCE_PATHS.has(normalizedPath)) return true;
  if (PREVIEW_RESOURCE_ROOTS.some((root) => isWithinPath(normalizedPath, root))) return true;

  if (normalizedPath === "/_next/image") {
    const query = search.startsWith("?") ? search.slice(1) : search;
    const source = new URLSearchParams(query).get("url");
    return Boolean(source && isPreviewImageSource(source));
  }

  return false;
}
