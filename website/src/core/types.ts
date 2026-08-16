export type BoxMode = "normal" | "minimized" | "expanded" | "fullscreen";

export type LayoutMode = "explore" | "grid" | "presentation";

export type ViewportMode = "desktop" | "tablet" | "mobile";

/** The four fixed points in the Region -> Rock -> Sector -> Topo journey. */
export type JourneyStation = "region" | "rock" | "sector" | "topo";

export type ScrubStationPhase = "preview" | "arrived";
export type ScrubStationSource = "button" | "wheel" | "drag" | "slider" | "static" | "skip";

export interface ScrubStationEventDetail {
  station: JourneyStation;
  progress: number;
  phase: ScrubStationPhase;
  source: ScrubStationSource;
}

/**
 * "cinematic" runs the three scrub chapters. "static" holds the final frame and
 * shows the workspace immediately — used for reduced-motion visitors and for
 * anyone who has already travelled the journey once.
 */
export type IntroMode = "cinematic" | "static";

export interface BoxState {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  zIndex: number;
  mode: BoxMode;
  /** The last non-exclusive frame used when leaving expanded/fullscreen. */
  restoreFrame?: {
    mode: "normal" | "expanded";
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  pinned: boolean;
  dataRef?: string;
  stackIndex?: number;
}

export interface LayoutState {
  boxes: BoxState[];
  activeBoxId: string | null;
  layoutMode: LayoutMode;
}

export interface ViewportBounds {
  width: number;
  height: number;
}

export interface ResponsiveImageSource {
  type: "image/avif" | "image/webp";
  srcSet: string;
}

export interface ExploreImageAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  sources?: ResponsiveImageSource[];
}

export interface ExploreModelAsset {
  src: string;
  bytes: number;
}

export interface ExploreContentBox {
  id: string;
  type: "gallery" | "spatial" | "panorama" | "note" | "model3d" | "atlas" | "nasenwand" | "wallreveal" | "info";
  title: string;
  /** Compact label used by the phone module rail; the full title remains authoritative elsewhere. */
  mobileLabel?: string;
  /** Region → crag → sector is the spatial spine the whole Lounge reads from. */
  region: string;
  crag: string;
  /** Omitted where no verified sector exists for the box yet. */
  sector?: string;
  description: string;
  /** Extra search terms that are not already in the title, crag or description. */
  keywords?: string[];
  image?: ExploreImageAsset;
  model?: ExploreModelAsset;
  initialLayout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ExploreWorkspaceManifest {
  /** Guardrail for the approved small-box workspace; richer content belongs inside these boxes. */
  maxBoxes: number;
  phone: {
    singleActive: boolean;
    primaryModuleIds: string[];
  };
  /** Reviewed station-to-module bindings; copy remains in the typed presentation layer for now. */
  stationFocus?: Partial<Record<JourneyStation, string>>;
}

export interface ScrollScrubChapterAsset {
  id: string;
  from: string;
  to: string;
  video: string;
  duration: number;
  alt: string;
  direction: "forward" | "reverse";
  objectPosition?: string;
}

export interface ScrollScrubSequenceAsset {
  poster: string;
  chapters: ScrollScrubChapterAsset[];
}

export interface ExploreContentRegistry {
  version: number;
  updatedAt: string;
  background: ExploreImageAsset;
  introScrubSequence: ScrollScrubSequenceAsset;
  boxes: ExploreContentBox[];
  workspace?: ExploreWorkspaceManifest;
  /** Small same-origin route indexes requested by the explicit offline pack. */
  offlineData?: string[];
  offlinePack: string[];
  heavyAssets: string[];
}
