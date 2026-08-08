export type NasenwandConceptId = 'split' | 'geological' | 'cinematic';
export type NasenwandFrameMode = 'wide' | 'detail' | 'monochrome';
export type NasenwandMediaId = 'film' | 'scrub' | 'pingpong' | 'story' | 'webp' | 'gif' | 'depth';

export interface NasenwandConcept {
  id: NasenwandConceptId;
  number: '01' | '02' | '06';
  name: string;
  shortLabel: string;
  instruction: string;
}

export interface NasenwandMediaMode {
  id: NasenwandMediaId;
  number: string;
  name: string;
  shortLabel: string;
  description: string;
  meta: string;
  kind: 'video' | 'scrub' | 'image' | 'depth';
  orientation?: 'landscape' | 'portrait';
  src?: string;
  sources?: Array<{ src: string; type: string }>;
}

export interface SpatialExperienceConfig {
  id: string;
  cragName: string;
  region: string;
  statusLabel: string;
  statusNote: string;
  poster: string;
  contours: string;
  depthLayers: string[];
  photo: {
    src: string;
    srcSet: string;
    alt: string;
  };
  spatial: {
    src: string;
    srcSet: string;
    alt: string;
  };
  topo: {
    src: string;
    srcSet: string;
    alt: string;
  };
  routes: {
    src: string;
    srcSet: string;
    alt: string;
  };
}

export const NASENWAND_MEDIA: NasenwandMediaMode[] = [
  {
    id: 'film',
    number: '01',
    name: 'Hero film',
    shortLabel: 'Film',
    description: 'The complete 40-second drone approach, presented as the keynote view of the wall.',
    meta: '40.6 sec · 16:9 · WebM + MP4 fallback',
    kind: 'video',
    sources: [
      { src: '/photography/nasenwand/media/hero-1080.webm', type: 'video/webm' },
      { src: '/photography/nasenwand/media/hero-720.mp4', type: 'video/mp4' },
    ],
  },
  {
    id: 'scrub',
    number: '02',
    name: 'Scroll scrub',
    shortLabel: 'Scrub',
    description: 'Scroll through the flight frame by frame, or drag directly across the image for exact control.',
    meta: '40.6 sec · all-keyframe derivative · scroll linked',
    kind: 'scrub',
    sources: [{ src: '/photography/nasenwand/media/scrub-540-allkey.mp4', type: 'video/mp4' }],
  },
  {
    id: 'pingpong',
    number: '03',
    name: 'Ping-pong loop',
    shortLabel: 'Ping-pong',
    description: 'A seamless twelve-second forward-and-back movement for cards, headers, and ambient panels.',
    meta: '12 sec · 1920 × 1080 · H.264',
    kind: 'video',
    sources: [{ src: '/photography/nasenwand/media/loop-pingpong-1080.mp4', type: 'video/mp4' }],
  },
  {
    id: 'story',
    number: '04',
    name: 'Story loop',
    shortLabel: 'Story',
    description: 'A vertical six-second cut built for mobile spot cards and social-first storytelling.',
    meta: '6 sec · 1080 × 1920 · portrait',
    kind: 'video',
    orientation: 'portrait',
    sources: [{ src: '/photography/nasenwand/media/loop-story-1080x1920.mp4', type: 'video/mp4' }],
  },
  {
    id: 'webp',
    number: '05',
    name: 'High-resolution loop',
    shortLabel: 'WebP',
    description: 'A quiet animated image loop for places where a video player would feel too heavy.',
    meta: '12 sec · 720 px derivative · animated WebP',
    kind: 'image',
    src: '/photography/nasenwand/media/loop-720.webp',
  },
  {
    id: 'gif',
    number: '06',
    name: 'Lightweight preview',
    shortLabel: 'GIF',
    description: 'The compact fallback for messages, previews, and low-capability embeds.',
    meta: '6 sec · 480 × 270 · animated GIF',
    kind: 'image',
    src: '/photography/nasenwand/media/loop-480.gif',
  },
  {
    id: 'depth',
    number: '07',
    name: 'Depth stack',
    shortLabel: 'Depth',
    description: 'Five separated image planes respond to the pointer to preview a spatial loading sequence.',
    meta: '5 layers · pointer depth · WebP',
    kind: 'depth',
  },
];

export const NASENWAND_CONCEPTS: NasenwandConcept[] = [
  {
    id: 'split',
    number: '01',
    name: 'Split Reveal',
    shortLabel: 'Split',
    instruction: 'Drag across the frame to compare the photograph with its spatial relief.',
  },
  {
    id: 'geological',
    number: '02',
    name: 'Geological Wipe',
    shortLabel: 'Geological',
    instruction: 'Drag to move an irregular rock-edge transition through the aligned views.',
  },
  {
    id: 'cinematic',
    number: '06',
    name: 'Cinematic',
    shortLabel: 'Cinematic',
    instruction: 'Scrub from source photography to spatial relief, then into the route reference.',
  },
];

export const NASENWAND_EXPERIENCE: SpatialExperienceConfig = {
  id: 'nasenwand-wachau',
  cragName: 'Nasenwand',
  region: 'Wachau, Austria',
  statusLabel: 'Flagship spot · production preview',
  statusNote: 'Route reference is provisional and must be verified before publication.',
  poster: '/photography/nasenwand/media/poster-1600.webp',
  contours: '/photography/nasenwand/media/topo-contours.svg',
  depthLayers: [
    '/photography/nasenwand/media/depth/layer_sky.webp',
    '/photography/nasenwand/media/depth/layer_valley.webp',
    '/photography/nasenwand/media/depth/layer_ridge.webp',
    '/photography/nasenwand/media/depth/layer_rock.webp',
    '/photography/nasenwand/media/depth/layer_fg.webp',
  ],
  photo: {
    src: '/photography/nasenwand/nasenwand-photo-2400.webp',
    srcSet:
      '/photography/nasenwand/nasenwand-photo-1280.webp 1280w, /photography/nasenwand/nasenwand-photo-2400.webp 2400w',
    alt: 'Drone photograph of the Nasenwand rock face in the Wachau',
  },
  spatial: {
    src: '/photography/nasenwand/nasenwand-spatial-2400.webp',
    srcSet:
      '/photography/nasenwand/nasenwand-spatial-1280.webp 1280w, /photography/nasenwand/nasenwand-spatial-2400.webp 2400w',
    alt: 'Spatial-relief study derived from the Nasenwand drone photograph',
  },
  topo: {
    src: '/photography/nasenwand/nasenwand-topo-2400.webp',
    srcSet:
      '/photography/nasenwand/nasenwand-topo-1280.webp 1280w, /photography/nasenwand/nasenwand-topo-2400.webp 2400w',
    alt: 'Provisional Nasenwand route reference image',
  },
  routes: {
    src: '/photography/nasenwand/nasenwand-routes-2400.png',
    srcSet:
      '/photography/nasenwand/nasenwand-routes-1280.png 1280w, /photography/nasenwand/nasenwand-routes-2400.png 2400w',
    alt: '',
  },
};
