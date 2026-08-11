"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useLayoutState } from "../../core/layoutState";
import type { BoxMode, BoxState, ViewportMode } from "../../core/types";
import styles from "./BoxContainer.module.css";

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

interface ResizeState extends DragState {
  originWidth: number;
  originHeight: number;
}

const controlLabel: Record<BoxMode, string> = {
  normal: "Normal size",
  minimized: "Restore box",
  expanded: "Exit expanded view",
  fullscreen: "Exit full screen",
};

export function BoxContainer({
  box,
  title,
  eyebrow,
  viewportMode,
  children,
}: {
  box: BoxState;
  title: string;
  eyebrow: string;
  viewportMode: ViewportMode;
  children: ReactNode;
}) {
  const dispatch = useLayoutState((state) => state.dispatch);
  const heroBoxId = useLayoutState((state) => state.heroBoxId);
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const [dragging, setDragging] = useState(false);
  const canFreeform = viewportMode === "desktop" && box.mode === "normal";

  const focus = () => dispatch({ type: "SET_ACTIVE_BOX", id: box.id });
  const setMode = (mode: BoxMode) => dispatch({ type: "UPDATE_BOX", id: box.id, patch: { mode } });

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canFreeform || (event.target as Element).closest("button")) return;
    focus();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: box.x,
      originY: box.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const width = box.width ?? 360;
    const height = box.height ?? 280;
    const x = Math.max(8, Math.min(window.innerWidth - Math.min(width, window.innerWidth) - 8, drag.originX + event.clientX - drag.startX));
    const y = Math.max(72, Math.min(window.innerHeight - Math.min(height, window.innerHeight) - 12, drag.originY + event.clientY - drag.startY));
    dispatch({ type: "UPDATE_BOX", id: box.id, patch: { x, y } });
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  };

  const beginResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!canFreeform) return;
    event.stopPropagation();
    focus();
    resizeRef.current = {
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
    dispatch({
      type: "UPDATE_BOX",
      id: box.id,
      patch: {
        width: Math.max(280, Math.min(window.innerWidth - resize.originX - 12, resize.originWidth + event.clientX - resize.startX)),
        height: Math.max(180, Math.min(window.innerHeight - resize.originY - 12, resize.originHeight + event.clientY - resize.startY)),
      },
    });
  };

  const endResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (resizeRef.current?.pointerId === event.pointerId) resizeRef.current = null;
  };

  const inlineStyle = viewportMode === "desktop"
    ? {
        transform: `translate3d(${box.x}px, ${box.y}px, 0)`,
        width: box.width,
        height: box.height,
        zIndex: box.zIndex,
      }
    : { zIndex: box.zIndex };

  return (
    <article
      className={`${styles.box} ${styles[`boxMode${box.mode[0].toUpperCase()}${box.mode.slice(1)}`]} ${dragging ? styles.dragging : ""}`}
      data-viewport={viewportMode}
      data-active={heroBoxId === box.id ? "hero" : undefined}
      style={inlineStyle}
      onPointerDown={focus}
    >
      <div
        className={styles.header}
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className={styles.handle} aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
        <div className={styles.heading}>
          <small>{eyebrow}</small>
          <h2>{title}</h2>
        </div>
        <div className={styles.controls}>
          <button type="button" onClick={() => dispatch({ type: "SET_HERO_BOX", id: box.id })} aria-label={`Promote ${title} to hero`} title="Promote to hero">◇</button>
          <button type="button" onClick={() => setMode(box.mode === "minimized" ? "normal" : "minimized")} aria-label={box.mode === "minimized" ? `Restore ${title}` : `Minimize ${title}`} title={controlLabel[box.mode]}>−</button>
          <button type="button" onClick={() => setMode(box.mode === "expanded" ? "normal" : "expanded")} aria-label={box.mode === "expanded" ? `Close expanded ${title}` : `Expand ${title}`} title="Expand">□</button>
          <button type="button" onClick={() => setMode(box.mode === "fullscreen" ? "normal" : "fullscreen")} aria-label={box.mode === "fullscreen" ? `Exit full screen ${title}` : `Open ${title} full screen`} title="Full screen">⛶</button>
        </div>
      </div>
      {box.mode !== "minimized" && <div className={styles.body}>{children}</div>}
      {canFreeform && (
        <button
          type="button"
          className={styles.resize}
          aria-label={`Resize ${title}`}
          onPointerDown={beginResize}
          onPointerMove={moveResize}
          onPointerUp={endResize}
          onPointerCancel={endResize}
        />
      )}
    </article>
  );
}
