import { describe, expect, it } from "vitest";
import { applyPilotToRegistry, pilotJourneyPreviewable, pilotJourneyReady, pilotUsesPreviewMedia, selectedPilotId } from "./pilotManifest";
import type { ExplorePilotManifest, PilotCatalog } from "./pilotTypes";
import type { ExploreContentRegistry } from "./types";

const catalog: PilotCatalog = {
  schemaVersion: 1,
  defaultPilot: "nasenwand",
  pilots: [
    { id: "nasenwand", cragSlug: "nasenwand", manifest: "/nasenwand.json", releaseState: "ready" },
    { id: "hel-jammerwandl", cragSlug: "jammerwandl", manifest: "/jammerwandl.json", releaseState: "assembly" },
  ],
};

const pilot = {
  id: "hel-jammerwandl",
  identity: { region: "Helenental", regionSlug: "helenental", crag: "Jammerwandl", cragSlug: "jammerwandl", sector: "Jammerwandl" },
  journey: {
    posterSlot: "hero",
    chapters: [
      { id: "region-rock", from: "Region", to: "Rock", asset: "scrubRegionRock", duration: null, direction: "forward" },
      { id: "rock-sector", from: "Rock", to: "Sector", asset: "scrubRockSector", duration: null, direction: "forward" },
      { id: "sector-topo", from: "Sector", to: "Topo", asset: "scrubSectorTopo", duration: null, direction: "forward" },
    ],
  },
  assets: { hero: { status: "missing", src: null } },
  modules: {
    locator: { title: "Helenental Locator", mobileLabel: "Atlas", description: "Locator", primarySlots: [] },
    panorama: { title: "Helenental Panorama", mobileLabel: "360", description: "Panorama", primarySlots: [] },
    routes: { title: "Jammerwandl Routes", mobileLabel: "Routes", description: "Routes", primarySlots: [] },
    wall: { title: "Jammerwandl Wall", mobileLabel: "Wall", description: "Wall", primarySlots: [] },
    topo: { title: "Jammerwandl Topo", mobileLabel: "Topo", description: "Topo", primarySlots: [] },
  },
} as unknown as ExplorePilotManifest;

describe("pilot selection", () => {
  it("prefers an explicit pilot and resolves crag links", () => {
    expect(selectedPilotId("?pilot=hel-jammerwandl", catalog)).toBe("hel-jammerwandl");
    expect(selectedPilotId("?crag=jammerwandl", catalog)).toBe("hel-jammerwandl");
    expect(selectedPilotId("?pilot=unknown", catalog)).toBe("nasenwand");
  });
});

describe("pilot registry projection", () => {
  it("keeps stable box ids while replacing pilot copy", () => {
    const registry = {
      version: 9,
      background: { src: "/background.webp", alt: "Background", width: 1, height: 1, sizes: "100vw" },
      introScrubSequence: { poster: "/poster.webp", chapters: [] },
      boxes: [
        { id: "crag-locator", type: "atlas", title: "Crag Locator", region: "Wachau", crag: "Wachau", description: "Atlas", initialLayout: { x: 0, y: 0, width: 1, height: 1 } },
        { id: "nasenwand-spatial", type: "nasenwand", title: "Nasenwand Routes", region: "Wachau", crag: "Nasenwand", sector: "Upper", description: "Routes", initialLayout: { x: 0, y: 0, width: 1, height: 1 } },
      ],
    } as unknown as ExploreContentRegistry;

    const projected = applyPilotToRegistry(registry, pilot);
    expect(projected.boxes.map((box) => box.id)).toEqual(["crag-locator", "nasenwand-spatial"]);
    expect(projected.boxes[1]).toMatchObject({ title: "Jammerwandl Routes", region: "Helenental", crag: "Jammerwandl", sector: "Jammerwandl" });
  });

  it("runs a borrowed local preview without promoting the pilot media slots to ready", () => {
    const proxyPilot = structuredClone(pilot) as ExplorePilotManifest;
    proxyPilot.journey.chapters.forEach((chapter, index) => {
      chapter.duration = index + 1;
      proxyPilot.assets[chapter.asset] = {
        kind: "video",
        status: "missing",
        targetPath: `/explore/pilots/hel-jammerwandl/scrub/${chapter.id}.mp4`,
        src: null,
        alt: `${chapter.id} local proxy`,
        preview: {
          adapter: "same-origin",
          src: `/proxies/${chapter.id}.mp4`,
          provenance: "Nasenwand reference media",
          verifiedForPilot: false,
          replaceable: true,
        },
      };
    });

    const registry = {
      version: 9,
      background: { src: "/background.webp", alt: "Background", width: 1, height: 1, sizes: "100vw" },
      introScrubSequence: { poster: "/poster.webp", chapters: [] },
      boxes: [],
    } as unknown as ExploreContentRegistry;

    expect(pilotJourneyReady(proxyPilot)).toBe(false);
    expect(pilotJourneyPreviewable(proxyPilot)).toBe(true);
    expect(pilotUsesPreviewMedia(proxyPilot)).toBe(true);
    expect(applyPilotToRegistry(registry, proxyPilot).introScrubSequence.chapters.map((chapter) => chapter.video)).toEqual([
      "/proxies/region-rock.mp4",
      "/proxies/rock-sector.mp4",
      "/proxies/sector-topo.mp4",
    ]);
  });
});
