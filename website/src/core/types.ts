export type BoxMode = "normal" | "minimized" | "expanded" | "fullscreen";

export type LayoutMode = "explore" | "grid" | "presentation";

export type ViewportMode = "desktop" | "tablet" | "mobile";

export interface BoxState {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  zIndex: number;
  mode: BoxMode;
  pinned: boolean;
  dataRef?: string;
  stackIndex?: number;
}

export interface LayoutState {
  boxes: BoxState[];
  activeBoxId: string | null;
  heroBoxId: string | null;
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
  crag: string;
  description: string;
  image?: ExploreImageAsset;
  model?: ExploreModelAsset;
  initialLayout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ScrollScrubAsset {
  video: string;
  poster: string;
  alt: string;
}

export interface ExploreContentRegistry {
  version: number;
  updatedAt: string;
  background: ExploreImageAsset;
  scrollScrubHero: ScrollScrubAsset;
  boxes: ExploreContentBox[];
  offlinePack: string[];
  heavyAssets: string[];
}
