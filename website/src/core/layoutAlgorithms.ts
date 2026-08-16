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
 * The desktop shell reserves lanes for the top chrome, right toolbar and the
 * bottom system affordances. Hero-first layouts stay inside this same frame.
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

/** Legacy/baseline station frames kept for the rollback preview path. */
export function stationFrameForBox(boxId: string, viewport?: ViewportBounds) {
  switch (boxId) {
    case "crag-locator":
      return centeredFrame(viewport, 0.86, 0.74, 760, 440);
    case "wall-reveal":
      return centeredFrame(viewport, 0.76, 0.72, 700, 420);
    case "nasenwand-spatial":
      return centeredFrame(viewport, 0.76, 0.74, 800, 450);
    case "nasenwand-model":
      return leftDockedFrame(viewport);
    case "wachau-16":
      return centeredFrame(viewport, 0.62, 0.52, 520, 360);
    default:
      return null;
  }
}

/**
 * One compact inspector frame for the normal hero-first working state.
 * It intentionally occupies about 8-13% of a desktop viewport by area.
 */
export function compactJourneyFrame(viewport?: ViewportBounds): BoxFrame {
  const rect = safeRect(viewport);
  const width = Math.min(rect.width, Math.max(280, Math.min(350, Math.round(rect.width * 0.255))));
  const height = Math.min(rect.height, Math.max(190, Math.min(250, Math.round(width / 1.42))));
  return {
    x: rect.x + Math.min(16, Math.max(0, rect.width - width)),
    y: rect.y + Math.min(16, Math.max(0, rect.height - height)),
    width,
    height,
  };
}

/**
 * Stable edge slots used when a minimized desktop module is restored. Align
 * can subsequently repack every open module, but merely opening one never
 * places it across the visual centre of the hero.
 */
export function heroFirstFrameForBox(boxId: string, viewport?: ViewportBounds): BoxFrame {
  const rect = safeRect(viewport);
  const base = compactJourneyFrame(viewport);
  const inset = Math.min(16, Math.max(0, rect.width - base.width));
  const left = rect.x + inset;
  const right = rect.x + Math.max(inset, rect.width - base.width - inset);
  const top = rect.y + Math.min(16, Math.max(0, rect.height - base.height));
  const bottom = rect.y + Math.max(16, rect.height - base.height - 16);
  const middle = rect.y + Math.max(16, Math.round((rect.height - base.height) / 2));

  switch (boxId) {
    case "nasenwand-spatial": return { ...base, x: right, y: top };
    case "wachau-16": return { ...base, x: left, y: bottom };
    case "nasenwand-model": return { ...base, x: right, y: bottom };
    case "wall-reveal": return { ...base, x: left, y: middle };
    case "crag-locator":
    default: return { ...base, x: left, y: top };
  }
}

/**
 * Explore/Align packs compact inspectors along the two outer edges and leaves
 * an uninterrupted centre corridor for the scrub/rock hero. Existing
 * minimized modules remain minimized and are simply given safe restore frames.
 */
export function applyExploreLayout(boxes: BoxState[], viewport?: ViewportBounds): BoxState[] {
  if (boxes.length === 0) return boxes;
  const rect = safeRect(viewport);
  const gap = 12;
  const edgeInset = Math.min(16, Math.max(0, rect.width - MIN_BOX_WIDTH));
  const maxWidthForCorridor = Math.max(MIN_BOX_WIDTH, Math.floor((rect.width - 220) / 2));
  const cardWidth = Math.min(
    maxWidthForCorridor,
    Math.max(260, Math.min(340, Math.round(rect.width * 0.245))),
  );
  const leftX = rect.x + edgeInset;
  const rightX = rect.x + Math.max(edgeInset, rect.width - cardWidth - edgeInset);

  const leftCount = Math.ceil(boxes.length / 2);
  const rightCount = Math.floor(boxes.length / 2);
  const maxRows = Math.max(1, leftCount, rightCount);
  const availableHeight = Math.max(MIN_BOX_HEIGHT, rect.height - edgeInset * 2 - gap * (maxRows - 1));
  const cardHeight = Math.max(
    MIN_BOX_HEIGHT,
    Math.min(235, Math.floor(availableHeight / maxRows)),
  );
  const columnY = [rect.y + edgeInset, rect.y + edgeInset];

  return boxes.map((box, index) => {
    const column = index % 2;
    const x = column === 0 ? leftX : rightX;
    const y = columnY[column];
    columnY[column] += cardHeight + gap;
    return {
      ...box,
      x,
      y,
      width: cardWidth,
      height: cardHeight,
      mode: box.mode === "minimized" ? "minimized" : "normal",
      restoreFrame: undefined,
    };
  });
}

/** Old full-grid base kept separate so Grid remains an intentional dense view. */
function gridBaseLayout(boxes: BoxState[], viewport?: ViewportBounds): BoxState[] {
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
  return gridBaseLayout(boxes, viewport).map((box) => {
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
