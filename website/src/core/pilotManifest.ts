import type { ExploreContentBox, ExploreContentRegistry } from "./types";
import type { ExplorePilotManifest, PilotAssetKey, PilotCatalog, PilotModuleKey } from "./pilotTypes";

const moduleForBoxId: Record<string, PilotModuleKey> = {
  "crag-locator": "locator",
  "wachau-16": "panorama",
  "nasenwand-spatial": "routes",
  "wall-reveal": "wall",
  "nasenwand-model": "topo",
};

export function selectedPilotId(search: string, catalog: PilotCatalog): string {
  const params = new URLSearchParams(search);
  const explicit = params.get("pilot");
  if (explicit && catalog.pilots.some((entry) => entry.id === explicit)) return explicit;
  const crag = params.get("crag");
  return catalog.pilots.find((entry) => entry.cragSlug === crag)?.id ?? catalog.defaultPilot;
}

export function applyPilotToRegistry(
  registry: ExploreContentRegistry,
  pilot: ExplorePilotManifest,
): ExploreContentRegistry {
  const boxes = registry.boxes.map((box): ExploreContentBox => {
    const moduleKey = moduleForBoxId[box.id];
    if (!moduleKey) return box;
    const module = pilot.modules[moduleKey];
    return {
      ...box,
      title: module.title,
      mobileLabel: module.mobileLabel,
      description: module.description,
      region: pilot.identity.region,
      crag: pilot.identity.crag,
      sector: moduleKey === "locator" || moduleKey === "panorama" ? undefined : pilot.identity.sector ?? undefined,
      keywords: [...(box.keywords ?? []), pilot.id, pilot.identity.regionSlug, pilot.identity.cragSlug],
    };
  });
  const posterSlot = pilot.assets[pilot.journey.posterSlot];
  const poster = posterSlot?.status === "ready" && posterSlot.src ? posterSlot.src : registry.background.src;
  const journeyPreviewable = pilotJourneyPreviewable(pilot);
  const introScrubSequence = journeyPreviewable
    ? {
        poster,
        chapters: pilot.journey.chapters.map((chapter) => ({
          id: chapter.id,
          from: chapter.from,
          to: chapter.to,
          video: pilotAssetPreviewSource(pilot.assets[chapter.asset]) as string,
          duration: chapter.duration as number,
          alt: pilot.assets[chapter.asset].alt,
          direction: chapter.direction,
          objectPosition: chapter.objectPosition,
        })),
      }
    : { ...registry.introScrubSequence, poster };
  return { ...registry, boxes, introScrubSequence };
}

export function pilotJourneyReady(pilot: ExplorePilotManifest): boolean {
  return pilot.journey.chapters.length === 3 && pilot.journey.chapters.every((chapter) => {
    const slot = pilot.assets[chapter.asset];
    return slot?.kind === "video" && slot.status === "ready" && Boolean(slot.src) && Boolean(chapter.duration && chapter.duration > 0);
  });
}

export function pilotAssetPreviewSource(slot: ExplorePilotManifest["assets"][PilotAssetKey]): string | null {
  if (slot.status === "ready" && slot.src) return slot.src;
  return slot.preview?.src ?? null;
}

export function pilotJourneyPreviewable(pilot: ExplorePilotManifest): boolean {
  return pilot.journey.chapters.length === 3 && pilot.journey.chapters.every((chapter) => {
    const slot = pilot.assets[chapter.asset];
    return slot?.kind === "video" && Boolean(pilotAssetPreviewSource(slot)) && Boolean(chapter.duration && chapter.duration > 0);
  });
}

export function pilotUsesPreviewMedia(pilot: ExplorePilotManifest): boolean {
  return pilot.journey.chapters.some((chapter) => Boolean(pilot.assets[chapter.asset]?.preview));
}

export function moduleKeyForContent(content: ExploreContentBox): PilotModuleKey | null {
  return moduleForBoxId[content.id] ?? null;
}
