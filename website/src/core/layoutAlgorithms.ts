import type { BoxState, ViewportBounds } from "./types";

export const GRID_SIZE = 40;

const DEFAULT_VIEWPORT: ViewportBounds = { width: 1440, height: 900 };
const MIN_BOX_WIDTH = 210;
const MIN_BOX_HEIGHT = 130;

const snap = (value: number, grid: number) => Math.round(value / grid) * grid;

function usableBounds(viewport?: ViewportBounds): ViewportBounds {
  const source = viewport ?? DEFAULT_VIEWPORT;
  return { width: Math.max(320, source.width), height: Math.max(480, source.height) };
}

export function applyExploreLayout(boxes: BoxState[], viewport?: ViewportBounds): BoxState[] {
  const bounds = usableBounds(viewport);
  const margin = bounds.width < 768 ? 16 : 20;
  const gap = 12;
  const columns = bounds.width >= 768 ? 2 : 1;
  const dockWidth = Math.min(bounds.width - 106, 620);
  const cardWidth = Math.max(MIN_BOX_WIDTH, Math.floor((dockWidth - margin * 2 - gap * (columns - 1)) / columns));
  const columnY = Array.from({ length: columns }, () => 92);

  return boxes.map((box) => {
    const column = columnY.indexOf(Math.min(...columnY));
    const width = Math.min(Math.max(MIN_BOX_WIDTH, box.width ?? cardWidth), cardWidth);
    const height = Math.min(230, Math.max(MIN_BOX_HEIGHT, box.height ?? 180));
    const y = columnY[column];
    columnY[column] += height + gap;
    return {
      ...box,
      x: margin + column * (cardWidth + gap),
      y,
      width,
      height,
      mode: box.mode === "minimized" ? "minimized" : "normal",
    };
  });
}

export function applyGridLayout(boxes: BoxState[], viewport?: ViewportBounds, grid = GRID_SIZE): BoxState[] {
  return applyExploreLayout(boxes, viewport).map((box) => ({
    ...box,
    x: snap(box.x, grid),
    y: snap(box.y, grid),
    width: Math.max(MIN_BOX_WIDTH, snap(box.width ?? 280, grid)),
    height: Math.max(MIN_BOX_HEIGHT, snap(box.height ?? 180, grid)),
  }));
}

export function applyPresentationLayout(
  boxes: BoxState[],
  viewport?: ViewportBounds,
  heroBoxId?: string | null,
): BoxState[] {
  if (boxes.length === 0) return boxes;
  const bounds = usableBounds(viewport);
  const margin = bounds.width < 768 ? 16 : 28;
  const gap = 14;
  const hero = boxes.find((box) => box.id === heroBoxId)
    ?? [...boxes].sort((a, b) => b.zIndex - a.zIndex)[0];
  const rest = boxes.filter((box) => box.id !== hero.id);

  if (bounds.width < 768) {
    return [hero, ...rest].map((box, index) => ({
      ...box,
      x: margin,
      y: 88 + index * 272,
      width: bounds.width - margin * 2,
      height: index === 0 ? Math.min(390, Math.round(bounds.height * 0.42)) : 256,
      mode: "normal",
      stackIndex: index,
    }));
  }

  const availableWidth = bounds.width - margin * 3 - 96;
  const heroWidth = Math.round(availableWidth * 0.58);
  const sideWidth = availableWidth - heroWidth;
  const heroHeight = Math.min(bounds.height - 166, 650);
  const sideColumns = sideWidth >= 560 ? 2 : 1;
  const sideRows = Math.max(1, Math.ceil(rest.length / sideColumns));
  const cardWidth = Math.floor((sideWidth - gap * (sideColumns - 1)) / sideColumns);
  const cardHeight = Math.max(MIN_BOX_HEIGHT, Math.floor((heroHeight - gap * (sideRows - 1)) / sideRows));

  return boxes.map((box) => {
    if (box.id === hero.id) {
      return { ...box, x: margin, y: 92, width: heroWidth, height: heroHeight, mode: "normal" };
    }
    const index = rest.findIndex((candidate) => candidate.id === box.id);
    const column = index % sideColumns;
    const row = Math.floor(index / sideColumns);
    return {
      ...box,
      x: margin * 2 + heroWidth + column * (cardWidth + gap),
      y: 92 + row * (cardHeight + gap),
      width: cardWidth,
      height: cardHeight,
      mode: "normal",
    };
  });
}
