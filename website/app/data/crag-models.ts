// 3D Lab — crag models shown on the homepage.
//
// `src` is a GLB served straight from /public. The current three files are
// low-poly placeholders so the gallery works before real photogrammetry output
// exists; drop a real scan in at the same path and nothing else changes.
//
// Posters are the photographs the model was built from, so the frame a visitor
// sees first is the real crag, with the geometry loading over it.

export interface CragModel {
  id: string;
  name: string;
  crag: string;
  /** GLB path under /public. */
  src: string;
  /** Still shown before the model loads. */
  poster: string;
  /** Short line under the viewer. */
  summary: string;
  routes: string;
  captured: string;
  /** Set false while a model is still a placeholder. */
  scanned: boolean;
  /** Shared panorama viewer for this crag. The route exists before imagery is uploaded. */
  panoramaHref: string;
  /**
   * Opening camera angle. A scanned wall is an open sheet, so the default
   * head-on orbit can land edge-on and show a sliver — each model gets the
   * angle its face actually reads from.
   */
  orbit?: string;
}

export const cragModels: CragModel[] = [
  {
    id: 'nasenwand-topo',
    name: 'Bergsteiger topo',
    crag: 'Nasenwand · Wachau',
    src: '/models/nasenwand-topo.glb',
    poster: '/photography/gallery/vm-6890-peilstein-main-face.webp',
    summary:
      'Photogrammetry of the Bergsteiger sector, rebuilt from a full drone and ground capture. 5.2 million triangles reduced to 208,000 for the browser.',
    routes: 'Topo in progress',
    captured: 'RealityScan · 2K texture',
    scanned: true,
    panoramaHref: '/explore/wachau/nasenwand/panorama',
    orbit: '118deg 78deg 105%',
  },
  {
    id: 'peilstein-main-face',
    name: 'Main face',
    crag: 'Peilstein',
    src: '/models/peilstein-main-face.glb',
    poster: '/photography/gallery/vm-6890-peilstein-main-face.webp',
    summary: 'The full sector from the approach path, with the classic lines on the left half.',
    routes: '14 routes · 4 to 7a',
    captured: 'Placeholder geometry',
    scanned: false,
    panoramaHref: '/explore/peilstein/peilstein/panorama',
  },
  {
    id: 'helenental-ost',
    name: 'Ost face',
    crag: 'Helenental',
    src: '/models/helenental-ost.glb',
    poster: '/photography/gallery/vm-6578-ost-face.webp',
    summary: 'North-facing and green until midday — the wall that never gets sun.',
    routes: '9 routes · 5+ to 6c',
    captured: 'Placeholder geometry',
    scanned: false,
    panoramaHref: '/explore/helenental/helenental/panorama',
  },
];
