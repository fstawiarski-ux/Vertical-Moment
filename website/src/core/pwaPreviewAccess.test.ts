import { describe, expect, it } from "vitest";
import { isBlockedDevelopmentRequest, isPwaPreviewRequest } from "./pwaPreviewAccess";

describe("PWA preview request classification", () => {
  it("allows the Explorer app and its route surfaces", () => {
    for (const path of [
      "/explore-app",
      "/explore-app/planner",
      "/explore-app/planner/list",
      "/explore-app/planner/trips",
      "/explore-app/planner/today",
      "/huts",
      "/huts/167",
      "/huts/sources",
      "/explore-app/planner/",
      "/explore-app/planner-content",
      "/explore-app/planner-content.html",
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

  it("does not classify public and private routes as PWA previews", () => {
    for (const path of [
      "/",
      "/about",
      "/services",
      "/climbers-lounge",
      "/review-preview",
      "/explore-app/unlisted-other-surface",
      "/explore-app/planner/private",
      "/explore-app/planner-content/private",
      "/explore-app/planner-content.html/extra",
      "/explore-app/planner.html",
      "/explore-app/field",
      "/api/unknown",
      "/photography/services/session-commercial.webp",
    ]) {
      expect(isPwaPreviewRequest(path), path).toBe(false);
    }
  });

  it("keeps private Field Ops pages and APIs outside the PWA preview allowlist", () => {
    expect(isPwaPreviewRequest("/explore-app/field")).toBe(false);
    expect(isPwaPreviewRequest("/api/field-ops/session")).toBe(false);
  });
});


describe("private development route blocking", () => {
  it("blocks known private and review-only surfaces", () => {
    for (const path of [
      "/api/field-ops/session",
      "/explore-app/field",
      "/explore-app/field/",
      "/explore-app/marcin-job-os",
      "/nasenwand-concepts",
      "/private/marcin-job-os.html",
      "/review-preview",
      "/vision/wall-reveal",
    ]) {
      expect(isBlockedDevelopmentRequest(path), path).toBe(true);
    }
  });

  it("keeps public pages and the unlisted PWA allowlist outside the blocklist", () => {
    for (const path of [
      "/",
      "/climbers-lounge",
      "/prints/panoramas",
      "/explore-app",
      "/explore",
      "/panoramas/wachau",
    ]) {
      expect(isBlockedDevelopmentRequest(path), path).toBe(false);
    }
  });
});
