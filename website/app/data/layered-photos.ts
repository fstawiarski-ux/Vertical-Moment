// 2.5D layered photo modules (Vertical_Moment_Layered_Photos_v1_2).
// Motion and scale values come straight from each module's photo.json —
// keep them subtle: 2px base, 7–10px subject, 13–14px nearest foreground.

export interface SceneLayer {
  src: string;
  /** Responsive alternatives for full-bleed scenes. */
  srcSet?: string;
  sizes?: string;
  /** Pointer travel in px for this plane. */
  motion: number;
  /** Slight upscale so the plane never exposes an edge while it moves. */
  scale: number;
  alt?: string;
}

export interface SceneShard {
  src: string;
  dx: number;
  dy: number;
  rot: number;
}

export interface LayeredScene {
  id: string;
  title: string;
  meta: string;
  orientation: 'portrait' | 'landscape';
  width: number;
  height: number;
  alt: string;
  layers: SceneLayer[];
  shards: SceneShard[];
}

const shardsFor = (id: string): SceneShard[] => [
  { src: `/photography/layered/${id}/shards/shard_01.webp`, dx: 52.1, dy: -108.1, rot: 8 },
  { src: `/photography/layered/${id}/shards/shard_02.webp`, dx: 117.0, dy: -26.7, rot: -13 },
  { src: `/photography/layered/${id}/shards/shard_03.webp`, dx: 93.8, dy: 74.8, rot: 18 },
  { src: `/photography/layered/${id}/shards/shard_04.webp`, dx: 0.0, dy: 120.0, rot: -23 },
  { src: `/photography/layered/${id}/shards/shard_05.webp`, dx: -93.8, dy: 74.8, rot: 28 },
  { src: `/photography/layered/${id}/shards/shard_06.webp`, dx: -117.0, dy: -26.7, rot: -33 },
  { src: `/photography/layered/${id}/shards/shard_07.webp`, dx: -52.1, dy: -108.1, rot: 38 },
];

/** Hero background — the approved smiling climber, kept central and unobstructed. */
export const heroScene: LayeredScene = {
  id: '9B3B7069',
  title: 'Smiling on the edge',
  meta: 'Wachau · Vertical Moment',
  orientation: 'portrait',
  width: 1920,
  height: 2876,
  alt: 'Smiling climber holding the edge of a steep rock face, photographed from above in the forest',
  layers: [
    {
      src: '/photography/hero/9B3B7069-smiling-climber-1280.webp',
      srcSet:
        '/photography/hero/9B3B7069-smiling-climber-768.webp 768w, /photography/hero/9B3B7069-smiling-climber-1280.webp 1280w, /photography/hero/9B3B7069-smiling-climber-1920.webp 1920w',
      sizes: '100vw',
      motion: 3,
      scale: 1.025,
      alt: 'Smiling climber on the edge',
    },
  ],
  shards: [],
};

/** Featured gallery tile — portrait, three planes: wall, person, hands. */
export const featuredScene: LayeredScene = {
  id: '9B3B6349',
  title: 'Chalked hands',
  meta: '2.5D',
  orientation: 'portrait',
  width: 1068,
  height: 1600,
  alt: 'Climber chalking their hands before pulling on, shot close from the side',
  layers: [
    { src: '/photography/layered/9B3B6349/background.webp', motion: 2, scale: 1.025, alt: 'Chalked hands' },
    { src: '/photography/layered/9B3B6349/person.webp', motion: 7, scale: 1.0082 },
    { src: '/photography/layered/9B3B6349/hands.webp', motion: 13, scale: 1.0153 },
  ],
  shards: shardsFor('9B3B6349'),
};

/** Copied and ready, not yet placed — swap into either slot above to try it. */
export const spareScene: LayeredScene = {
  id: '9B3B6520',
  title: 'Hand on rock',
  meta: '2.5D',
  orientation: 'portrait',
  width: 1068,
  height: 1600,
  alt: 'A single hand crimping a limestone edge, the rock falling out of focus behind',
  layers: [
    { src: '/photography/layered/9B3B6520/background.webp', motion: 2, scale: 1.025, alt: 'Hand on rock' },
    { src: '/photography/layered/9B3B6520/near_rock.webp', motion: 7, scale: 1.0082 },
    { src: '/photography/layered/9B3B6520/hand.webp', motion: 14, scale: 1.0165 },
  ],
  shards: shardsFor('9B3B6520'),
};
