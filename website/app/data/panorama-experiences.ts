import { panoramas, type Panorama } from './panoramas';

export type PanoramaChapterId = 'region' | 'crag' | 'sector' | '360' | 'videos';
export type PanoramaChapterKind = 'panorama' | 'external-360' | 'videos';
export type SectorViewId = 'photo' | 'spatial' | 'topo' | 'routes' | 'model';

export interface PanoramaMediaAsset {
  id: string;
  title: string;
  src: string;
  thumbnail: string;
  srcSet?: string;
  displayWidth: number;
  displayHeight: number;
  alt: string;
}

export interface PanoramaChapter {
  id: PanoramaChapterId;
  number: string;
  label: string;
  kind: PanoramaChapterKind;
  mediaPanoramaId: string;
  headline: string;
  scale: number;
  description: string;
}

export interface PanoramaReferenceLink {
  label: string;
  meta: string;
  href: string;
}

export interface PanoramaSectorToolkit {
  photoId: string;
  spatialId: string;
  topoId: string;
  routesId: string;
  modelSrc: string;
  modelPosterId: string;
}

export interface PanoramaVideoOption {
  id: string;
  label: string;
  meta: string;
  description: string;
  kind: 'image' | 'video' | 'scrub';
  src?: string;
  poster?: string;
  orientation?: 'landscape' | 'portrait';
  sources?: Array<{ src: string; type: string }>;
  contourOverlay?: string;
}

export interface PanoramaExperienceDefinition {
  id: string;
  region: string;
  regionSlug: string;
  crag: string;
  cragSlug: string;
  heroPanoramaId: string;
  cragPanoramaId?: string;
  sectorPanoramaId?: string;
  additionalMedia?: PanoramaMediaAsset[];
  external360Href?: string;
  external360EmbedUrl?: string;
  videosHref?: string;
  referenceLinks?: PanoramaReferenceLink[];
  sectorToolkit?: PanoramaSectorToolkit;
  videoOptions?: PanoramaVideoOption[];
  headline: string;
  focusLabel: string;
  routeSummary: string;
}

export interface PanoramaExperienceModel extends PanoramaExperienceDefinition {
  gallery: Panorama[];
  media: PanoramaMediaAsset[];
  hasCragFocus: boolean;
  chapters: PanoramaChapter[];
}

const NASENWAND_MEDIA: PanoramaMediaAsset[] = [
  {
    id: 'nasenwand-photo',
    title: 'Nasenwand source photograph',
    src: '/photography/nasenwand/nasenwand-photo-2400.webp',
    thumbnail: '/photography/nasenwand/nasenwand-photo-1280.webp',
    srcSet:
      '/photography/nasenwand/nasenwand-photo-1280.webp 1280w, /photography/nasenwand/nasenwand-photo-2400.webp 2400w',
    displayWidth: 2400,
    displayHeight: 1800,
    alt: 'Drone photograph of the Nasenwand rock face in the Wachau',
  },
  {
    id: 'nasenwand-spatial',
    title: 'Nasenwand spatial study',
    src: '/photography/nasenwand/nasenwand-spatial-2400.webp',
    thumbnail: '/photography/nasenwand/nasenwand-spatial-1280.webp',
    srcSet:
      '/photography/nasenwand/nasenwand-spatial-1280.webp 1280w, /photography/nasenwand/nasenwand-spatial-2400.webp 2400w',
    displayWidth: 2400,
    displayHeight: 1800,
    alt: 'Monochrome spatial-relief study derived from the Nasenwand drone photograph',
  },
  {
    id: 'nasenwand-topo',
    title: 'Nasenwand topo reference',
    src: '/photography/nasenwand/nasenwand-topo-2400.webp',
    thumbnail: '/photography/nasenwand/nasenwand-topo-1280.webp',
    srcSet:
      '/photography/nasenwand/nasenwand-topo-1280.webp 1280w, /photography/nasenwand/nasenwand-topo-2400.webp 2400w',
    displayWidth: 2400,
    displayHeight: 1800,
    alt: 'Provisional Nasenwand route reference over the registered wall photograph',
  },
  {
    id: 'nasenwand-routes',
    title: 'Nasenwand route layer',
    src: '/photography/nasenwand/nasenwand-routes-2400.png',
    thumbnail: '/photography/nasenwand/nasenwand-routes-1280.png',
    srcSet:
      '/photography/nasenwand/nasenwand-routes-1280.png 1280w, /photography/nasenwand/nasenwand-routes-2400.png 2400w',
    displayWidth: 2400,
    displayHeight: 1800,
    alt: '',
  },
];

const NASENWAND_VIDEOS: PanoramaVideoOption[] = [
  {
    id: 'overview',
    label: 'Overview',
    meta: '290 KB still · immediate',
    description: 'A lightweight poster introduces the wall before any motion file is requested.',
    kind: 'image',
    src: '/photography/nasenwand/media/poster-1600.webp',
  },
  {
    id: 'film',
    label: 'Film',
    meta: '40.6 sec · WebM + MP4',
    description: 'The full drone approach loads only when this film tab is selected.',
    kind: 'video',
    poster: '/photography/nasenwand/media/poster-1600.webp',
    sources: [
      { src: '/photography/nasenwand/media/hero-1080.webm', type: 'video/webm' },
      { src: '/photography/nasenwand/media/hero-720.mp4', type: 'video/mp4' },
    ],
  },
  {
    id: 'scrub',
    label: 'Scroll scrub',
    meta: '40.6 sec · all-keyframe',
    description: 'Drag the timeline or scroll over the stage to move through the flight frame by frame.',
    kind: 'scrub',
    poster: '/photography/nasenwand/media/poster-1600.webp',
    sources: [{ src: '/photography/nasenwand/media/scrub-540-allkey.mp4', type: 'video/mp4' }],
    contourOverlay: '/photography/nasenwand/media/topo-contours.svg',
  },
  {
    id: 'loop',
    label: 'Loop',
    meta: '12 sec · ping-pong',
    description: 'A quiet forward-and-back movement for crag cards and ambient headers.',
    kind: 'video',
    poster: '/photography/nasenwand/media/loop-480.gif',
    sources: [{ src: '/photography/nasenwand/media/loop-pingpong-1080.mp4', type: 'video/mp4' }],
  },
  {
    id: 'story',
    label: 'Story',
    meta: '6 sec · portrait',
    description: 'The vertical edit previews the future mobile and channel format.',
    kind: 'video',
    orientation: 'portrait',
    poster: '/photography/nasenwand/media/loop-480.gif',
    sources: [{ src: '/photography/nasenwand/media/loop-story-1080x1920.mp4', type: 'video/mp4' }],
  },
];

export const panoramaExperienceDefinitions: PanoramaExperienceDefinition[] = [
  {
    id: 'wachau-durnstein',
    region: 'Wachau',
    regionSlug: 'wachau',
    crag: 'Dürnstein',
    cragSlug: 'durnstein',
    heroPanoramaId: 'wachau-09',
    cragPanoramaId: 'wachau-14',
    sectorPanoramaId: 'wachau-15',
    headline: 'From the river bend to the wall.',
    focusLabel: 'Dürnstein',
    routeSummary: 'Crag registration in progress',
  },
  {
    id: 'wachau-nasenwand',
    region: 'Wachau',
    regionSlug: 'wachau',
    crag: 'Nasenwand',
    cragSlug: 'nasenwand',
    heroPanoramaId: 'wachau-09',
    cragPanoramaId: 'nasenwand-photo',
    sectorPanoramaId: 'nasenwand-topo',
    additionalMedia: NASENWAND_MEDIA,
    external360Href: 'https://maps.app.goo.gl/eXBK67PMrUGCVvsS7',
    external360EmbedUrl:
      'https://www.google.com/maps/embed?pb=!3m2!1sen!2sat!4v1786272580869!5m2!1sen!2sat!6m8!1m7!1sCAoSFkNJSE0wb2dLRUlDQWdJREUwcUNBTWc.!2m2!1d48.39575198431061!2d15.51663212296914!3f211.83674207632868!4f1.4136926584171903!5f0.7820865974627469',
    videosHref: '/nasenwand-concepts',
    referenceLinks: [
      {
        label: 'Bergsteigen topo',
        meta: 'Route overview and access notes',
        href: 'https://www.bergsteigen.com/touren/klettergarten/nasenwand-duernstein-wachau/',
      },
      {
        label: 'theCrag map',
        meta: 'Community route and sector reference',
        href: 'https://www.thecrag.com/climbing/wachau/maps#48.402022,15.518068,18.0,,auto',
      },
      {
        label: 'Google 360°',
        meta: 'Public drone sphere',
        href: 'https://maps.app.goo.gl/eXBK67PMrUGCVvsS7',
      },
    ],
    sectorToolkit: {
      photoId: 'nasenwand-photo',
      spatialId: 'nasenwand-spatial',
      topoId: 'nasenwand-topo',
      routesId: 'nasenwand-routes',
      modelSrc: '/models/nasenwand-topo.glb',
      modelPosterId: 'nasenwand-spatial',
    },
    videoOptions: NASENWAND_VIDEOS,
    headline: 'From the Danube corridor to Nasenwand.',
    focusLabel: 'Nasenwand',
    routeSummary: 'Topo, 360° and motion preview',
  },
];

export const regionPanoramaCollections = [
  {
    region: 'Wachau',
    regionSlug: 'wachau',
    panoramaIds: panoramas.map((panorama) => panorama.id),
  },
];

export function slugifyPanoramaSegment(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function titleFromSlug(value: string) {
  return decodeURIComponent(value)
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getRegionPanoramas(regionSlug: string) {
  const collection = regionPanoramaCollections.find((item) => item.regionSlug === regionSlug);
  if (!collection) return [];
  const ids = new Set(collection.panoramaIds);
  return panoramas.filter((panorama) => ids.has(panorama.id));
}

function buildChapters({
  crag,
  headline,
  heroPanoramaId,
  cragPanoramaId,
  sectorPanoramaId,
}: {
  region: string;
  crag: string;
  headline: string;
  heroPanoramaId: string;
  cragPanoramaId: string;
  sectorPanoramaId: string;
}): PanoramaChapter[] {
  return [
    {
      id: 'region',
      number: '01',
      label: 'Region',
      kind: 'panorama',
      mediaPanoramaId: heroPanoramaId,
      headline,
      scale: 1,
      description: 'Move across the complete regional panorama to understand the river, approaches and relationship between crags.',
    },
    {
      id: 'crag',
      number: '02',
      label: 'Crag',
      kind: 'panorama',
      mediaPanoramaId: cragPanoramaId,
      headline: `${crag} comes into focus.`,
      scale: 1,
      description: 'Move from the regional overview into a dedicated crag photograph while keeping the wall in geographic context.',
    },
    {
      id: 'sector',
      number: '03',
      label: 'Sector',
      kind: 'panorama',
      mediaPanoramaId: sectorPanoramaId,
      headline: 'Photography becomes a field layer.',
      scale: 1,
      description: 'Compare the photograph, spatial study, provisional topo, route layer and browser-ready wall model.',
    },
    {
      id: '360',
      number: '04',
      label: '360°',
      kind: 'external-360',
      mediaPanoramaId: heroPanoramaId,
      headline: 'Look around from the drone position.',
      scale: 1,
      description: 'The public Google Maps sphere is added only when this chapter opens, keeping it outside the first page load.',
    },
    {
      id: 'videos',
      number: '05',
      label: 'Videos',
      kind: 'videos',
      mediaPanoramaId: sectorPanoramaId,
      headline: 'Movement, loaded only on demand.',
      scale: 1,
      description: 'Start with a light poster, then choose the full approach, frame-accurate scroll scrub, ambient loop or portrait story.',
    },
  ];
}

export function getPanoramaExperience(regionSlug: string, cragSlug?: string): PanoramaExperienceModel {
  const exact = cragSlug
    ? panoramaExperienceDefinitions.find(
        (item) => item.regionSlug === regionSlug && item.cragSlug === cragSlug,
      )
    : undefined;
  const collection = regionPanoramaCollections.find((item) => item.regionSlug === regionSlug);
  const gallery = getRegionPanoramas(regionSlug);
  const region = collection?.region ?? titleFromSlug(regionSlug);
  const crag = exact?.crag ?? (cragSlug ? titleFromSlug(cragSlug) : `${region} panoramas`);
  const heroPanoramaId = exact?.heroPanoramaId ?? gallery[0]?.id ?? '';
  const wallStudies = gallery.filter((panorama) => panorama.category === 'wall-study');
  const cragPanoramaId = exact?.cragPanoramaId ?? wallStudies[0]?.id ?? gallery[1]?.id ?? heroPanoramaId;
  const sectorPanoramaId = exact?.sectorPanoramaId ?? wallStudies.at(-1)?.id ?? gallery.at(-1)?.id ?? cragPanoramaId;

  return {
    id: exact?.id ?? `${regionSlug}-${cragSlug ?? 'region'}`,
    region,
    regionSlug,
    crag,
    cragSlug: exact?.cragSlug ?? cragSlug ?? 'region',
    heroPanoramaId,
    cragPanoramaId,
    sectorPanoramaId,
    additionalMedia: exact?.additionalMedia,
    external360Href: exact?.external360Href,
    external360EmbedUrl: exact?.external360EmbedUrl,
    videosHref: exact?.videosHref,
    referenceLinks: exact?.referenceLinks,
    sectorToolkit: exact?.sectorToolkit,
    videoOptions: exact?.videoOptions,
    headline: exact?.headline ?? `The ${region} landscape, kept in context.`,
    focusLabel: exact?.focusLabel ?? crag,
    routeSummary: exact?.routeSummary ?? (gallery.length ? 'Regional panorama collection' : 'Panorama capture not uploaded yet'),
    gallery,
    media: [...gallery, ...(exact?.additionalMedia ?? [])],
    hasCragFocus: Boolean(exact),
    chapters: buildChapters({
      region,
      crag,
      headline: exact?.headline ?? `The ${region} landscape, kept in context.`,
      heroPanoramaId,
      cragPanoramaId,
      sectorPanoramaId,
    }),
  };
}

export function getCragPanoramaHref(region: string, crag: string, route?: string) {
  const base = `/explore/${slugifyPanoramaSegment(region)}/${slugifyPanoramaSegment(crag)}/panorama`;
  return route ? `${base}?route=${encodeURIComponent(route)}` : base;
}

export function getRegionPanoramaHref(region: string) {
  return `/explore/${slugifyPanoramaSegment(region)}/panoramas`;
}
