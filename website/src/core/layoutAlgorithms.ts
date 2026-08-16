import type { BoxState, ViewportBounds } from "./types";

export const GRID_SIZE = 40;

const DEFAULT_VIEWPORT: ViewportBounds = { width: 1440, height: 900 };
const MIN_BOX_WIDTH = 210;
const MIN_BOX_HEIGHT = 130;

export type ResizeDirection = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

export interface BoxFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The desktop shell reserves the same lanes for every layout consumer:
 * brand/peek content above, the right toolbar, and the fixed scrub rail below.
 * Keep these base values in step with the CSS variables in ExploreApp.module.css.
 */
export const EXPLORE_SAFE_ZONE: Readonly<Record<"top" | "right" | "bottom" | "left", number>> = Object.freeze({
  top: 112,
  right: 106,
  bottom: 112,
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

/** Apply one of the eight resize directions inside the shared shell safe zone. */
export function resizeBoxFrame(
  origin: BoxFrame,
  direction: ResizeDirection,
  dx: number,
  dy: number,
  viewport?: ViewportBounds,
): BoxFrame {
  const bounds = usableBounds(viewport);
  const safeRight = Math.max(EXPLORE_SAFE_ZONE.left + MIN_BOX_WIDTH, bounds.width - EXPLORE_SAFE_ZONE.right);
  const safeBottom = Math.max(EXPLORE_SAFE_ZONE.top + MIN_BOX_HEIGHT, bounds.height - EXPLORE_SAFE_ZONE.bottom);
  const originX = clamp(origin.x, EXPLORE_SAFE_ZONE.left, safeRight - MIN_BOX_WIDTH);
  const originY = clamp(origin.y, EXPLORE_SAFE_ZONE.top, safeBottom - MIN_BOX_HEIGHT);
  const originRight = clamp(origin.x + origin.width, originX + MIN_BOX_WIDTH, safeRight);
  const originBottom = clamp(origin.y + origin.height, originY + MIN_BOX_HEIGHT, safeBottom);

  let x = originX;
  let y = originY;
  let right = originRight;
  let bottom = originBottom;

  if (direction.includes("w")) x = clamp(originX + dx, EXPLORE_SAFE_ZONE.left, originRight - MIN_BOX_WIDTH);
  if (direction.includes("e")) right = clamp(originRight + dx, originX + MIN_BOX_WIDTH, safeRight);
  if (direction.includes("n")) y = clamp(originY + dy, EXPLORE_SAFE_ZONE.top, originBottom - MIN_BOX_HEIGHT);
  if (direction.includes("s")) bottom = clamp(originBottom + dy, originY + MIN_BOX_HEIGHT, safeBottom);

  return { x, y, width: Math.max(MIN_BOX_WIDTH, right - x), height: Math.max(MIN_BOX_HEIGHT, bottom - y) };
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

function leftDockedFrame(viewport: ViewportBounds | undefined) {
  const rect = safeRect(viewport);
  const width = Math.min(rect.width, Math.max(400, Math.round(rect.width * 0.34)));
  const height = Math.min(rect.height, Math.max(360, Math.round(rect.height * 0.64)));
  return {
    x: rect.x + 16,
    y: rect.y + 16,
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
      // The final station keeps the fixed arrival composition on the left,
      // while desktop users may still drag or resize the freeform box.
      return leftDockedFrame(viewport);
    case "wachau-16":
      // Panorama controls need a readable restored frame instead of the small
      // registry thumbnail used by the initial content preview.
      return centeredFrame(viewport, 0.62, 0.52, 520, 360);
    default:
      return null;
  }
}

/**
 * The phone-inspired large-screen hierarchy keeps one intentional task on the
 * left while leaving most of the scrub hero visible. The returned frame stays
 * inside the same safe zone used by drag and resize, so desktop interaction can
 * continue from this compact starting point without a geometry jump.
 */
export function compactJourneyFrame(viewport?: ViewportBounds): BoxFrame {
  const rect = safeRect(viewport);
  const width = Math.min(rect.width, Math.max(320, Math.min(480, Math.round(rect.width * 0.38))));
  const height = Math.min(rect.height, Math.max(230, Math.min(340, Math.round(width / 1.43))));
  return {
    x: rect.x + Math.min(16, Math.max(0, rect.width - width)),
    y: rect.y + Math.min(16, Math.max(0, rect.height - height)),
    width,
    height,
  };
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
      restoreFrame: undefined,
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
      restoreFrame: undefined,
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
      return { ...box, x: rect.x, y: rect.y, width: heroWidth, height: heroHeight, mode: "normal", restoreFrame: undefined };
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
      restoreFrame: undefined,
    };
  });
}
