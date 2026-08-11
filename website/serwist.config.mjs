import { serwist } from "@serwist/next/config";

export default await serwist({
  swSrc: "src/pwa/service-worker.ts",
  swDest: "public/sw.js",
  precachePrerendered: false,
  globPatterns: [
    ".next/static/**/*.{js,css,html,ico,png,avif,webp,svg,json,webmanifest}",
  ],
  additionalPrecacheEntries: [
    { url: "/explore-app", revision: "explore-app-v1" },
    { url: "/offline", revision: "offline-v1" },
    { url: "/explore-content.json", revision: "registry-v1" },
    { url: "/manifest.webmanifest", revision: "manifest-v1" },
    { url: "/icons/explore-app-192.png", revision: "icon-v1" },
    { url: "/icons/explore-app-512.png", revision: "icon-v1" },
    { url: "/icons/explore-app-maskable-512.png", revision: "icon-v1" },
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
