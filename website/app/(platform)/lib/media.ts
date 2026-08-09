/**
 * Resolves media availability for a crag BY SLUG, against the existing
 * assets already in the repo — never a copy of their metadata. Two
 * existing sources today:
 *
 *   - data/models.json   3D photogrammetry walls (crag name -> .glb)
 *   - crag.links[]        "exact" links already carry a topo when one's
 *                          been verified for that crag (see database/master
 *                          canonical.json's per-crag links block)
 *
 * photos/panorama have no per-crag manifest yet — no such index exists in
 * the repo (photography-gallery.tsx is a hand-curated homepage set, not
 * crag-tagged). Wiring those is future work; both default to false rather
 * than guessing.
 */
import modelsData from "../data/models.json";
import type { ExternalLink, MediaAvailability } from "./climbing-types";

type WallModel = {
  wall_id: string; crag: string; sector_id?: string;
  glb: string; status: string; webReady: boolean; note?: string;
};
const MODELS = modelsData as WallModel[];

export function find3DModel(cragName: string): WallModel | null {
  return MODELS.find(m => m.crag.toLowerCase() === cragName.toLowerCase()) ?? null;
}

function hasTopo(links: ExternalLink[]): boolean {
  return links.some(l => l.kind === "exact" && /topo/i.test(l.label + " " + (l.note ?? "")));
}

export function mediaFor(cragName: string, links: ExternalLink[]): MediaAvailability {
  return {
    photos: false,
    panorama: false,
    model3d: find3DModel(cragName) !== null,
    topo: hasTopo(links),
  };
}
