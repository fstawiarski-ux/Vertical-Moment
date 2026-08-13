"use client";

import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useLayoutState } from "../../core/layoutState";
import type { BoxMode, BoxState, ViewportMode } from "../../core/types";
import styles from "./BoxContainer.module.css";

type ResizeDirection = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

interface ResizeState extends DragState {
  direction: ResizeDirection;
  originWidth: number;
  originHeight: number;
}

const MIN_WIDTH = 210;
const MIN_HEIGHT = 130;
const BOX_GAP = 10;
const RIGHT_RAIL = 106;
const BOTTOM_TIMELINE = 66;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const resizeClass: Record<ResizeDirection, string> = {
  n: styles.resizeN,
  ne: styles.resizeNe,
  e: styles.resizeE,
  se: styles.resizeSe,
  s: styles.resizeS,
  sw: styles.resizeSw,
  w: styles.resizeW,
  nw: styles.resizeNw,
};

const controlLabel: Record<BoxMode, string> = {
  normal: "Normal size",
  minimized: "Restore box",
  expanded: "Exit expanded view",
  fullscreen: "Exit full screen",
};

export function BoxContainer({ box, title, eyebrow, viewportMode, children, journeyPresentation, onManualInteraction }: {
  box: BoxState;
  title: string;
  eyebrow: string;
  viewportMode: ViewportMode;
  children: ReactNode;
  journeyPresentation?: "focus" | "support";
  onManualInteraction?: () => void;
}) {
  const dispatch = useLayoutState((state) => state.dispatch);
  const boxes = useLayoutState((state) => state.boxes);
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const [dragging, setDragging] = useState(false);
  const presentationBox = journeyPresentation === "focus" ? { ...box, mode: "normal" as const } : box;
  const canFreeform = viewportMode === "desktop" && presentationBox.mode === "normal" && !journeyPresentation;

  const focus = () => dispatch({ type: "SET_ACTIVE_BOX", id: box.id });
  const setMode = (mode: BoxMode) => {
    onManualInteraction?.();
    dispatch({ type: "UPDATE_BOX", id: box.id, patch: { mode } });
  };

  const isCollisionFree = (x: number, y: number, width: number, height: number) => boxes.every((other) => {
    if (other.id === box.id || other.mode !== "normal") return true;
    const otherWidth = other.width ?? 360;
    const otherHeight = other.height ?? 280;
    return x + width + BOX_GAP <= other.x
      || other.x + otherWidth + BOX_GAP <= x
      || y + height + BOX_GAP <= other.y
      || other.y + otherHeight + BOX_GAP <= y;
  });

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canFreeform || (event.target as Element).closest("button")) return;
    focus();
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: box.x, originY: box.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const width = box.width ?? 360;
    const height = box.height ?? 280;
    const x = clamp(drag.originX + event.clientX - drag.startX, 8, Math.max(8, window.innerWidth - width - RIGHT_RAIL));
    const y = clamp(drag.originY + event.clientY - drag.startY, 72, Math.max(72, window.innerHeight - height - BOTTOM_TIMELINE));
    if (isCollisionFree(x, y, width, height)) dispatch({ type: "UPDATE_BOX", id: box.id, patch: { x, y } });
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  };

  const beginResize = (direction: ResizeDirection) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!canFreeform) return;
    event.stopPropagation();
    focus();
    resizeRef.current = {
      direction,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: box.x,
      originY: box.y,
      originWidth: box.width ?? 360,
      originHeight: box.height ?? 280,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    const dx = event.clientX - resize.startX;
    const dy = event.clientY - resize.startY;
    let x = resize.originX;
    let y = resize.originY;
    let width = resize.originWidth;
    let height = resize.originHeight;

    if (resize.direction.includes("e")) width = clamp(resize.originWidth + dx, MIN_WIDTH, window.innerWidth - resize.originX - RIGHT_RAIL);
    if (resize.direction.includes("s")) height = clamp(resize.originHeight + dy, MIN_HEIGHT, window.innerHeight - resize.originY - BOTTOM_TIMELINE);
    if (resize.direction.includes("w")) {
      x = clamp(resize.originX + dx, 8, resize.originX + resize.originWidth - MIN_WIDTH);
      width = resize.originWidth + resize.originX - x;
    }
    if (resize.direction.includes("n")) {
      y = clamp(resize.originY + dy, 72, resize.originY + resize.originHeight - MIN_HEIGHT);
      height = resize.originHeight + resize.originY - y;
    }

    if (isCollisionFree(x, y, width, height)) {
      dispatch({ type: "UPDATE_BOX", id: box.id, patch: { x, y, width, height } });
    }
  };

  const endResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (resizeRef.current?.pointerId === event.pointerId) resizeRef.current = null;
  };

  const width = presentationBox.width ?? 360;
  const height = presentationBox.height ?? 280;
  const contentScale = viewportMode === "desktop" && presentationBox.mode === "normal"
    ? clamp(Math.min(width / 360, height / 280), 0.58, 1)
    : 1;
  const contentInverse = 1 / contentScale;
  const inlineStyle = viewportMode === "desktop"
    ? {
        transform: `translate3d(${presentationBox.x}px, ${presentationBox.y}px, 0)`,
        width: presentationBox.width,
        height: presentationBox.height,
        zIndex: presentationBox.zIndex,
        "--box-content-scale": contentScale,
        "--box-content-inverse": contentInverse,
      } as CSSProperties
    : { zIndex: box.zIndex };

  return (
    <article
      className={`${styles.box} ${styles[`boxMode${presentationBox.mode[0].toUpperCase()}${presentationBox.mode.slice(1)}`]} ${journeyPresentation ? styles[`journey${journeyPresentation[0].toUpperCase()}${journeyPresentation.slice(1)}`] : ""} ${dragging ? styles.dragging : ""}`}
      data-viewport={viewportMode}
      style={inlineStyle}
      onPointerDown={focus}
    >
      <div className={styles.chrome}>
        <div className={styles.header} onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
          <span className={styles.handle} aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
          <div className={styles.heading}><small>{eyebrow}</small><h2>{title}</h2></div>
          <div className={styles.controls}>
            <button type="button" onClick={() => setMode(box.mode === "minimized" ? "normal" : "minimized")} aria-label={box.mode === "minimized" ? `Restore ${title}` : `Minimize ${title}`} title={controlLabel[box.mode]}>−</button>
            <button type="button" onClick={() => setMode(box.mode === "expanded" ? "normal" : "expanded")} aria-label={box.mode === "expanded" ? `Close expanded ${title}` : `Expand ${title}`} title="Expand">□</button>
            <button type="button" onClick={() => setMode(box.mode === "fullscreen" ? "normal" : "fullscreen")} aria-label={box.mode === "fullscreen" ? `Exit full screen ${title}` : `Open ${title} full screen`} title="Full screen">⛶</button>
          </div>
        </div>
        {box.mode !== "minimized" && <div className={styles.body}>{children}</div>}
      </div>
      {canFreeform && (Object.keys(resizeClass) as ResizeDirection[]).map((direction) => (
        <button
          key={direction}
          type="button"
          className={`${styles.resizeHandle} ${resizeClass[direction]}`}
          aria-label={`Resize ${title} from ${direction}`}
          onPointerDown={beginResize(direction)}
          onPointerMove={moveResize}
          onPointerUp={endResize}
          onPointerCancel={endResize}
        />
      ))}
    </article>
  );
}
