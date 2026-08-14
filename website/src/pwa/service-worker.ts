/// <reference lib="webworker" />

import {
  CacheFirst,
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  RangeRequestsPlugin,
  Serwist,
  StaleWhileRevalidate,
  type PrecacheEntry,
} from "serwist";

declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: Array<PrecacheEntry | string> };

const isSameOrigin = (url: URL) => url.origin === self.location.origin;
const isExploreAppNavigation = (pathname: string) => (
  pathname === "/explore-app" || pathname.startsWith("/explore-app/")
);

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    // The precached /explore-app shell is stored without a query string, so any
    // parameter left in this list must be stripped before lookup or the
    // navigation misses precache entirely and falls through to the network —
    // which offline means the /offline fallback.
    //
    // Every deep-link parameter belongs here: the shell is byte-identical for
    // all of them and the client reads window.location.search after boot. The
    // manifest shortcuts are all ?open=…&intro=skip, so without this an
    // installed app cannot cold-start offline from its own shortcuts.
    ignoreURLParametersMatching: [
      /^utm_/,
      /^vm-/,
      /^source$/,
      /^open$/,
      /^crag$/,
      /^sector$/,
      /^intro$/,
      /^mode$/,
    ],
  },
  runtimeCaching: [
    {
      matcher: ({ url, request }) => request.method === "GET" && (
        url.hostname === "tile.openstreetmap.org"
        || url.hostname.endsWith(".tile.opentopomap.org")
        || url.hostname === "server.arcgisonline.com"
        || url.hostname.endsWith(".basemaps.cartocdn.com")
        || url.hostname === "api.mapbox.com"
      ),
      handler: new CacheFirst({
        cacheName: "vm-map-tiles-v1",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 160, maxAgeSeconds: 14 * 24 * 60 * 60, purgeOnQuotaError: true }),
        ],
      }),
    },
    {
      matcher: ({ url, request }) => isSameOrigin(url) && request.method === "GET" && url.pathname.endsWith(".glb"),
      handler: new CacheFirst({
        cacheName: "vm-models-v1",
        plugins: [
          new CacheableResponsePlugin({ statuses: [200] }),
          new ExpirationPlugin({ maxEntries: 3, maxAgeSeconds: 180 * 24 * 60 * 60, purgeOnQuotaError: true }),
        ],
      }),
    },
    {
      matcher: ({ url, request }) => isSameOrigin(url) && request.method === "GET" && url.pathname.endsWith(".mp4"),
      handler: new CacheFirst({
        cacheName: "vm-scrub-video-v2",
        plugins: [
          new CacheableResponsePlugin({ statuses: [200] }),
          new RangeRequestsPlugin(),
          new ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 30 * 24 * 60 * 60, purgeOnQuotaError: true }),
        ],
      }),
    },
    {
      matcher: ({ url, request }) => isSameOrigin(url) && request.method === "GET" && url.pathname === "/explore-content.json",
      handler: new StaleWhileRevalidate({
        cacheName: "vm-explore-registry-v1",
        plugins: [new CacheableResponsePlugin({ statuses: [200] })],
      }),
    },
    {
      matcher: ({ url, request }) => isSameOrigin(url) && request.method === "GET" && request.destination === "image",
      handler: new CacheFirst({
        cacheName: "vm-images-v1",
        plugins: [
          new CacheableResponsePlugin({ statuses: [200] }),
          new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 24 * 60 * 60, purgeOnQuotaError: true }),
        ],
      }),
    },
    {
      matcher: ({ url, request }) => isSameOrigin(url)
        && request.mode === "navigate"
        && isExploreAppNavigation(url.pathname),
      handler: new NetworkFirst({
        cacheName: "vm-explore-pages-v1",
        networkTimeoutSeconds: 3,
        plugins: [new CacheableResponsePlugin({ statuses: [200] })],
      }),
    },
  ],
  fallbacks: {
    entries: [{
      url: "/offline",
      matcher: ({ request }) => request.destination === "document",
    }],
  },
  disableDevLogs: true,
});

serwist.addEventListeners();
