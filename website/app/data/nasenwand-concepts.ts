export type NasenwandConceptId = 'split' | 'geological' | 'cinematic';
export type NasenwandFrameMode = 'wide' | 'detail' | 'monochrome';

export interface NasenwandConcept {
  id: NasenwandConceptId;
  number: '01' | '02' | '06';
  name: string;
  shortLabel: string;
  instruction: string;
}

export interface SpatialExperienceConfig {
  id: string;
  cragName: string;
  region: string;
  statusLabel: string;
  statusNote: string;
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
  statusLabel: 'Spatial study · prototype',
  statusNote: 'Route reference is provisional and must be verified before publication.',
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
