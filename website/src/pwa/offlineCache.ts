"use client";

/**
 * The cache the service worker's same-origin image and atlas-data routes read.
 *
 * Offline packs are saved by the page, not by the worker, so they have to write
 * into this exact cache to be servable later. A programmatic `cache.add()` or
 * `fetch()` carries `request.destination === ""`, not `"image"`, so it never
 * matches the worker's image route and never gets mirrored here on its own —
 * a pack written to its own private cache is stored but unreachable offline.
 *
 * Entries the page adds are invisible to the route's ExpirationPlugin, which
 * only evicts URLs it recorded itself. That is the behaviour we want: an asset
 * the user explicitly asked to keep is not evicted by ordinary browsing.
 */
export const RUNTIME_IMAGE_CACHE = "vm-images-v1";

/**
 * Private pack caches from before the packs wrote to the runtime cache. Nothing
 * reads these, so they are pure dead storage on returning visitors.
 */
const LEGACY_PACK_CACHES = ["vm-offline-pack-v1", "vm-wachau-panorama-pack-v1"];

export function dropLegacyPackCaches(): void {
  if (typeof window === "undefined" || !("caches" in window)) return;
  for (const name of LEGACY_PACK_CACHES) {
    void caches.delete(name).catch(() => { /* Storage can be locked down; nothing to reclaim. */ });
  }
}
