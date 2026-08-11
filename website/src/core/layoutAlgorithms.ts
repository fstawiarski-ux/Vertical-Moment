import type { BoxState, ViewportBounds } from "./types";

export const GRID_SIZE = 40;

const DEFAULT_VIEWPORT: ViewportBounds = { width: 1440, height: 900 };
const MIN_BOX_WIDTH = 280;
const MIN_BOX_HEIGHT = 180;

const snap = (value: number, grid: number) => Math.round(value / grid) * grid;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function usableBounds(viewport?: ViewportBounds): ViewportBounds {
  const source = viewport ?? DEFAULT_VIEWPORT;
  return {
    width: Math.max(320, source.width),
    height: Math.max(480, source.height),
  };
}

export function applyGridLayout(
  boxes: BoxState[],
  viewport?: ViewportBounds,
  grid = GRID_SIZE,
): BoxState[] {
  const bounds = usableBounds(viewport);
  const margin = bounds.width < 768 ? 16 : 24;

  return boxes.map((box) => {
    const width = Math.min(
      Math.max(MIN_BOX_WIDTH, snap(box.width ?? 360, grid)),
      Math.max(MIN_BOX_WIDTH, bounds.width - margin * 2),
    );
    const height = Math.min(
      Math.max(MIN_BOX_HEIGHT, snap(box.height ?? 280, grid)),
      Math.max(MIN_BOX_HEIGHT, bounds.height - margin * 2),
    );

    return {
      ...box,
      x: clamp(snap(box.x, grid), margin, Math.max(margin, bounds.width - width - margin)),
      y: clamp(snap(box.y, grid), margin, Math.max(margin, bounds.height - height - margin)),
      width,
      height,
    };
  });
}

export function applyExploreLayout(boxes: BoxState[], viewport?: ViewportBounds): BoxState[] {
  const bounds = usableBounds(viewport);
  const margin = bounds.width < 768 ? 16 : 32;
  const columns = bounds.width >= 1280 ? 3 : bounds.width >= 768 ? 2 : 1;
  const availableWidth = bounds.width - margin * (columns + 1);
  const cardWidth = Math.max(MIN_BOX_WIDTH, Math.floor(availableWidth / columns));

  return boxes.map((box, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const stagger = columns > 1 && column % 2 === 1 ? 36 : 0;
    const width = Math.min(box.width ?? cardWidth, cardWidth);
    const height = Math.max(MIN_BOX_HEIGHT, box.height ?? 280);

    return {
      ...box,
      x: margin + column * (cardWidth + margin),
      y: 112 + row * 320 + stagger,
      width,
      height,
      mode: box.mode === "minimized" ? "minimized" : "normal",
    };
  });
}

export function applyPresentationLayout(
  boxes: BoxState[],
  viewport?: ViewportBounds,
  heroBoxId?: string | null,
): BoxState[] {
  if (boxes.length === 0) return boxes;

  const bounds = usableBounds(viewport);
  const margin = bounds.width < 768 ? 16 : 28;
  const hero = boxes.find((box) => box.id === heroBoxId)
    ?? [...boxes].sort((a, b) => b.zIndex - a.zIndex)[0];
  const rest = boxes.filter((box) => box.id !== hero.id);

  if (bounds.width < 768) {
    return [hero, ...rest].map((box, index) => ({
      ...box,
      x: margin,
      y: 88 + index * 300,
      width: bounds.width - margin * 2,
      height: index === 0 ? Math.min(420, Math.round(bounds.height * 0.44)) : 260,
      mode: "normal",
      stackIndex: index,
    }));
  }

  const heroWidth = Math.round((bounds.width - margin * 3) * 0.64);
  const columnWidth = bounds.width - heroWidth - margin * 3;
  const heroHeight = Math.min(bounds.height - 136, 620);
  const columnGap = 18;
  const columnHeight = Math.max(190, Math.floor((heroHeight - columnGap * Math.max(0, rest.length - 1)) / Math.max(1, rest.length)));

  return boxes.map((box) => {
    if (box.id === hero.id) {
      return {
        ...box,
        x: margin,
        y: 96,
        width: heroWidth,
        height: heroHeight,
        mode: "normal",
      };
    }

    const index = rest.findIndex((candidate) => candidate.id === box.id);
    return {
      ...box,
      x: margin * 2 + heroWidth,
      y: 96 + index * (columnHeight + columnGap),
      width: columnWidth,
      height: columnHeight,
      mode: "normal",
    };
  });
}
