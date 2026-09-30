import { describe, expect, it } from "vitest";
import { isPwaPreviewRequest } from "./pwaPreviewAccess";

describe("PWA preview maintenance gate", () => {
  it("allows the Explorer app and its route surfaces", () => {
    for (const path of [
      "/explore-app",
      "/explore-app/planner",
      "/explore-app/planner/",
      "/explore-app/planner.html",
      "/explore",
      "/explore/hohe-wand",
      "/explore/hohe-wand/nasenwand",
      "/panoramas/wachau",
      "/contribute",
      "/report",
      "/offline",
    ]) {
      expect(isPwaPreviewRequest(path), path).toBe(true);
    }
  });

  it("allows only the required PWA data and static resource families", () => {
    for (const path of [
      "/sw.js",
      "/manifest.webmanifest",
      "/explore-content.json",
      "/data/v1/regions.json",
      "/explore/pilots/index.json",
      "/explore/regions/wachau/region.json",
      "/_next/static/chunks/app.js",
      "/photography/explore-app/scrub/region-rock-pan-a.mp4",
      "/photography/nasenwand/nasenwand-photo-1280.webp",
      "/photography/nasenwand/media/poster-1600.webp",
      "/photography/panoramas/wachau/wachau-16-preview.webp",
      "/models/nasenwand-topo.glb",
      "/brand/official-v2/icons/forest-192.png",
      "/vendor/leaflet/leaflet.js",
    ]) {
      expect(isPwaPreviewRequest(path), path).toBe(true);
    }
  });

  it("limits optimized images to PWA media", () => {
    expect(isPwaPreviewRequest(
      "/_next/image",
      "?url=%2Fphotography%2Fexplore-app%2Fnasenwand.webp&w=640&q=75",
    )).toBe(true);
    expect(isPwaPreviewRequest(
      "/_next/image",
      "?url=https%3A%2F%2Fevil.example%2Fimage.webp&w=640&q=75",
    )).toBe(false);
    expect(isPwaPreviewRequest(
      "/_next/image",
      "?url=%2Fphotography%2Fservices%2Fsession-commercial.webp&w=640&q=75",
    )).toBe(false);
  });

  it("keeps the main website and unrelated APIs behind maintenance", () => {
    for (const path of [
      "/",
      "/about",
      "/services",
      "/climbers-lounge",
      "/review-preview",
      "/explore-app/unlisted-other-surface",
      "/explore-app/planner/private",
      "/explore-app/planner.html/extra",
      "/explore-app/field",
      "/api/unknown",
      "/photography/services/session-commercial.webp",
    ]) {
      expect(isPwaPreviewRequest(path), path).toBe(false);
    }
  });

  it("keeps the separate private Field Ops page and API behind maintenance", () => {
    expect(isPwaPreviewRequest("/explore-app/field")).toBe(false);
    expect(isPwaPreviewRequest("/api/field-ops/session")).toBe(false);
  });
});
