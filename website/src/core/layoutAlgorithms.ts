import type { BoxState, ViewportBounds } from "./types";

export const GRID_SIZE = 40;

const DEFAULT_VIEWPORT: ViewportBounds = { width: 1440, height: 900 };
const MIN_BOX_WIDTH = 210;
const MIN_BOX_HEIGHT = 130;

/**
 * The desktop shell reserves the same lanes for every layout consumer:
 * brand/peek content above, the right toolbar, and the journey rail below.
 * Keep these base values in step with the CSS variables in ExploreApp.module.css.
 */
export const EXPLORE_SAFE_ZONE: Readonly<Record<"top" | "right" | "bottom" | "left", number>> = Object.freeze({
  top: 146,
  right: 106,
  bottom: 96,
  left: 8,
});

const snap = (value: number, grid: number) => Math.round(value / grid) * grid;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function usableBounds(viewport?: ViewportBounds): ViewportBounds {
  const source = viewport ?? DEFAULT_VIEWPORT;
  return { width: Math.max(320, source.width), height: Math.max(480, source.height) };
}

function safeRect(viewport?: ViewportBounds) {
  const bounds = usableBounds(viewport);
  return {
    x: EXPLORE_SAFE_ZONE.left,
    y: EXPLORE_SAFE_ZONE.top,
    width: Math.max(0, bounds.width - EXPLORE_SAFE_ZONE.left - EXPLORE_SAFE_ZONE.right),
    height: Math.max(0, bounds.height - EXPLORE_SAFE_ZONE.top - EXPLORE_SAFE_ZONE.bottom),
  };
}

function centeredFrame(
  viewport: ViewportBounds | undefined,
  widthRatio: number,
  heightRatio: number,
  minWidth: number,
  minHeight: number,
) {
  const rect = safeRect(viewport);
  const width = Math.min(rect.width, Math.max(minWidth, Math.round(rect.width * widthRatio)));
  const height = Math.min(rect.height, Math.max(minHeight, Math.round(rect.height * heightRatio)));
  return {
    x: rect.x + Math.max(0, Math.round((rect.width - width) / 2)),
    y: rect.y + Math.max(0, Math.round((rect.height - height) / 2)),
    width,
    height,
  };
}

/** Station-specific starting frames for the four deliberate journey workspaces. */
export function stationFrameForBox(boxId: string, viewport?: ViewportBounds) {
  switch (boxId) {
    case "crag-locator":
      return centeredFrame(viewport, 0.86, 0.74, 760, 440);
    case "wall-reveal":
      return centeredFrame(viewport, 0.76, 0.72, 700, 420);
    case "nasenwand-spatial":
      return centeredFrame(viewport, 0.76, 0.74, 800, 450);
    case "nasenwand-model":
      return centeredFrame(viewport, 0.72, 0.78, 760, 480);
    default:
      return null;
  }
}

export function applyExploreLayout(boxes: BoxState[], viewport?: ViewportBounds): BoxState[] {
  const bounds = usableBounds(viewport);
  const rect = safeRect(viewport);
  const gap = 12;
  const columns = bounds.width >= 768 ? 2 : 1;
  const cardWidth = Math.max(MIN_BOX_WIDTH, Math.floor((rect.width - gap * (columns - 1)) / columns));
  const rows = Math.max(1, Math.ceil(boxes.length / columns));
  const maxCardHeight = Math.max(MIN_BOX_HEIGHT, Math.floor((rect.height - gap * (rows - 1)) / rows));
  const columnY = Array.from({ length: columns }, () => rect.y);

  return boxes.map((box) => {
    const column = columnY.indexOf(Math.min(...columnY));
    const width = Math.min(Math.max(MIN_BOX_WIDTH, box.width ?? cardWidth), cardWidth);
    const height = Math.min(maxCardHeight, Math.max(MIN_BOX_HEIGHT, box.height ?? 180));
    const y = columnY[column];
    columnY[column] += height + gap;
    return {
      ...box,
      x: rect.x + column * (cardWidth + gap),
      y,
      width,
      height,
      mode: box.mode === "minimized" ? "minimized" : "normal",
    };
  });
}

export function applyGridLayout(boxes: BoxState[], viewport?: ViewportBounds, grid = GRID_SIZE): BoxState[] {
  const rect = safeRect(viewport);
  return applyExploreLayout(boxes, viewport).map((box) => {
    const width = Math.min(rect.width, Math.max(MIN_BOX_WIDTH, snap(box.width ?? 280, grid)));
    const height = Math.min(rect.height, Math.max(MIN_BOX_HEIGHT, snap(box.height ?? 180, grid)));
    const x = clamp(snap(box.x, grid), rect.x, rect.x + Math.max(0, rect.width - width));
    const y = clamp(snap(box.y, grid), rect.y, rect.y + Math.max(0, rect.height - height));
    return { ...box, x, y, width, height };
  });
}

export function applyPresentationLayout(
  boxes: BoxState[],
  viewport?: ViewportBounds,
  focusBoxId?: string | null,
): BoxState[] {
  if (boxes.length === 0) return boxes;
  const bounds = usableBounds(viewport);
  const rect = safeRect(viewport);
  const gap = 14;
  const hero = boxes.find((box) => box.id === focusBoxId)
    ?? [...boxes].sort((a, b) => b.zIndex - a.zIndex)[0];
  const rest = boxes.filter((box) => box.id !== hero.id);

  if (bounds.width < 768) {
    return [hero, ...rest].map((box, index) => ({
      ...box,
      x: rect.x,
      y: rect.y + index * 272,
      width: rect.width,
      height: index === 0 ? Math.min(390, Math.round(bounds.height * 0.42)) : 256,
      mode: "normal",
      stackIndex: index,
    }));
  }

  const availableWidth = Math.max(0, rect.width - gap);
  const heroWidth = Math.round(availableWidth * 0.58);
  const sideWidth = availableWidth - heroWidth;
  const heroHeight = Math.min(rect.height, 650);
  const sideColumns = sideWidth >= 560 ? 2 : 1;
  const sideRows = Math.max(1, Math.ceil(rest.length / sideColumns));
  const cardWidth = Math.floor((sideWidth - gap * (sideColumns - 1)) / sideColumns);
  const cardHeight = Math.max(MIN_BOX_HEIGHT, Math.floor((heroHeight - gap * (sideRows - 1)) / sideRows));

  return boxes.map((box) => {
    if (box.id === hero.id) {
      return { ...box, x: rect.x, y: rect.y, width: heroWidth, height: heroHeight, mode: "normal" };
    }
    const index = rest.findIndex((candidate) => candidate.id === box.id);
    const column = index % sideColumns;
    const row = Math.floor(index / sideColumns);
    return {
      ...box,
      x: rect.x + heroWidth + gap + column * (cardWidth + gap),
      y: rect.y + row * (cardHeight + gap),
      width: cardWidth,
      height: cardHeight,
      mode: "normal",
    };
  });
}
