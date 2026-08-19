"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useLayoutState } from "../../core/layoutState";
import { EXPLORE_SAFE_ZONE, resizeBoxFrame, type ResizeDirection } from "../../core/layoutAlgorithms";
import type { BoxState, ViewportMode } from "../../core/types";
import styles from "./BoxContainer.module.css";

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  captureTarget?: Element;
}

interface ResizeState extends DragState {
  direction: ResizeDirection;
  originWidth: number;
  originHeight: number;
  cleanup?: () => void;
  captureTarget?: Element;
}

type ResizePoint = Pick<PointerEvent, "pointerId" | "clientX" | "clientY">;

const BOX_GAP = 10;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type WindowControlIconName = "restore" | "close" | "fullscreen" | "move";

function WindowControlIcon({ name }: { name: WindowControlIconName }) {
  if (name === "restore") {
    return (
      <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }
  if (name === "close") {
    return (
      <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  }
  if (name === "move") {
    return (
      <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M3 12h18" />
        <path d="m8 6 4-3 4 3M8 18l4 3 4-3M6 8l-3 4 3 4M18 8l3 4-3 4" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H5v4M15 5h4v4M9 19H5v-4M15 19h4v-4" />
    </svg>
  );
}

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

export function BoxContainer({ box, title, eyebrow, viewportMode, children }: {
  box: BoxState;
  title: string;
  eyebrow: string;
  viewportMode: ViewportMode;
  children: ReactNode;
}) {
  const dispatch = useLayoutState((state) => state.dispatch);
  const boxes = useLayoutState((state) => state.boxes);
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const boxesRef = useRef(boxes);
  const [dragging, setDragging] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const controlsHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canFreeform = viewportMode === "desktop" && box.mode === "normal";

  useEffect(() => { boxesRef.current = boxes; }, [boxes]);

  const revealControls = () => {
    if (controlsHideRef.current) clearTimeout(controlsHideRef.current);
    setControlsVisible(true);
  };

  const hideControlsSoon = () => {
    if (controlsHideRef.current) clearTimeout(controlsHideRef.current);
    controlsHideRef.current = setTimeout(() => setControlsVisible(false), 1600);
  };

  useEffect(() => () => {
    if (controlsHideRef.current) clearTimeout(controlsHideRef.current);
  }, []);

  const focus = () => {
    dispatch({ type: "SET_ACTIVE_BOX", id: box.id });
    revealControls();
  };
  const setMode = (mode: BoxState["mode"]) => {
    dispatch({ type: "SET_BOX_MODE", id: box.id, mode });
  };

  const isCollisionFree = (x: number, y: number, width: number, height: number) => boxesRef.current.every((other) => {
    if (other.id === box.id || other.mode !== "normal") return true;
    const otherWidth = other.width ?? 360;
    const otherHeight = other.height ?? 280;
    return x + width + BOX_GAP <= other.x
      || other.x + otherWidth + BOX_GAP <= x
      || y + height + BOX_GAP <= other.y
      || other.y + otherHeight + BOX_GAP <= y;
  });

  const beginDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (!canFreeform || (event.target as Element).closest("button")) return;
    focus();
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: box.x, originY: box.y, captureTarget: event.currentTarget };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const beginControlDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!canFreeform) return;
    event.preventDefault();
    event.stopPropagation();
    focus();
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: box.x, originY: box.y, captureTarget: event.currentTarget };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const width = box.width ?? 360;
    const height = box.height ?? 280;
    const x = clamp(
      drag.originX + event.clientX - drag.startX,
      EXPLORE_SAFE_ZONE.left,
      Math.max(EXPLORE_SAFE_ZONE.left, window.innerWidth - width - EXPLORE_SAFE_ZONE.right),
    );
    const y = clamp(
      drag.originY + event.clientY - drag.startY,
      EXPLORE_SAFE_ZONE.top,
      Math.max(EXPLORE_SAFE_ZONE.top, window.innerHeight - height - EXPLORE_SAFE_ZONE.bottom),
    );
    if (isCollisionFree(x, y, width, height)) dispatch({ type: "UPDATE_BOX", id: box.id, patch: { x, y } });
  };

  const finishDrag = (pointerId?: number) => {
    const drag = dragRef.current;
    if (!drag || (pointerId !== undefined && drag.pointerId !== pointerId)) return;
    if (drag.pointerId >= 0 && drag.captureTarget?.hasPointerCapture?.(drag.pointerId)) {
      try { drag.captureTarget.releasePointerCapture(drag.pointerId); } catch { /* Pointer capture may already be gone. */ }
    }
    dragRef.current = null;
    setDragging(false);
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => finishDrag(event.pointerId);

  const beginResize = (direction: ResizeDirection) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!canFreeform || resizeRef.current) return;
    event.stopPropagation();
    event.preventDefault();
    focus();
    const resize: ResizeState = {
      direction,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: box.x,
      originY: box.y,
      originWidth: box.width ?? 360,
      originHeight: box.height ?? 280,
      captureTarget: event.currentTarget,
    };
    const onMove = (moveEvent: PointerEvent) => moveResize(moveEvent);
    const onEnd = (endEvent: PointerEvent) => {
      finishResize(endEvent.pointerId);
    };
    resize.cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      if (resize.pointerId >= 0 && resize.captureTarget?.hasPointerCapture?.(resize.pointerId)) {
        try { resize.captureTarget.releasePointerCapture(resize.pointerId); } catch { /* Pointer capture may already be gone. */ }
      }
    };
    resizeRef.current = resize;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const beginMouseResize = (direction: ResizeDirection) => (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (!canFreeform || resizeRef.current) return;
    event.stopPropagation();
    event.preventDefault();
    focus();
    const mousePointerId = -1;
    const resize: ResizeState = {
      direction,
      pointerId: mousePointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: box.x,
      originY: box.y,
      originWidth: box.width ?? 360,
      originHeight: box.height ?? 280,
    };
    const onMove = (moveEvent: MouseEvent) => moveResize({ pointerId: mousePointerId, clientX: moveEvent.clientX, clientY: moveEvent.clientY });
    const onEnd = () => finishResize(mousePointerId);
    resize.cleanup = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);
    };
    resizeRef.current = resize;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);
  };

  const moveResize = (event: ResizePoint) => {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    const frame = resizeBoxFrame(
      { x: resize.originX, y: resize.originY, width: resize.originWidth, height: resize.originHeight },
      resize.direction,
      event.clientX - resize.startX,
      event.clientY - resize.startY,
      { width: window.innerWidth, height: window.innerHeight },
    );

    if (isCollisionFree(frame.x, frame.y, frame.width, frame.height)) {
      dispatch({ type: "UPDATE_BOX", id: box.id, patch: frame });
    }
  };

  const finishResize = (pointerId: number) => {
    if (resizeRef.current?.pointerId !== pointerId) return;
    resizeRef.current.cleanup?.();
    resizeRef.current = null;
  };

  useEffect(() => {
    const cancelInteraction = () => {
      finishDrag();
      if (resizeRef.current) {
        resizeRef.current.cleanup?.();
        resizeRef.current = null;
      }
    };
    window.addEventListener("blur", cancelInteraction);
    return () => {
      window.removeEventListener("blur", cancelInteraction);
      cancelInteraction();
    };
  }, []);

  useEffect(() => {
    if (box.mode !== "normal") {
      finishDrag();
      if (resizeRef.current) {
        resizeRef.current.cleanup?.();
        resizeRef.current = null;
      }
    }
  }, [box.mode]);

  const width = box.width ?? 360;
  const height = box.height ?? 280;
  const modeClass = styles[`boxMode${box.mode[0].toUpperCase()}${box.mode.slice(1)}`] ?? "";
  const contentScale = viewportMode === "desktop" && box.mode === "normal"
    ? clamp(Math.min(width / 360, height / 280), 0.58, 1)
    : 1;
  const contentInverse = 1 / contentScale;
  const inlineStyle = viewportMode === "desktop"
    ? {
        transform: `translate3d(${box.x}px, ${box.y}px, 0)`,
        width: box.width,
        height: box.height,
        zIndex: box.zIndex,
        "--box-content-scale": contentScale,
        "--box-content-inverse": contentInverse,
      } as CSSProperties
    : { zIndex: box.zIndex };

  return (
    <article
      className={`${styles.box} ${modeClass} ${dragging ? styles.dragging : ""}`}
      data-viewport={viewportMode}
      data-mode={box.mode}
      data-box-id={box.id}
      data-module-chrome="minimal"
      data-controls-visible={controlsVisible ? "true" : "false"}
      aria-label={`${title} module`}
      style={inlineStyle}
      onPointerDown={focus}
      onPointerUp={hideControlsSoon}
      onPointerCancel={hideControlsSoon}
      onMouseEnter={revealControls}
      onMouseLeave={hideControlsSoon}
      onFocusCapture={revealControls}
      onBlurCapture={hideControlsSoon}
    >
      <div className={styles.chrome}>
        <div data-drag-surface="true" className={styles.header} onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
          <span data-module-handle="true" className={styles.handle} aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
          <div data-module-heading="true" className={styles.heading}><small>{eyebrow}</small><h2>{title}</h2></div>
          <div data-module-window-controls="true" className={styles.windowControls} aria-label={`${title} window controls`}>
            <button type="button" onClick={() => setMode(box.mode === "minimized" ? "normal" : "minimized")} aria-label={box.mode === "minimized" ? `Restore ${title}` : `Hide ${title}`} title={box.mode === "minimized" ? `Restore ${title}` : `Hide ${title}`}><WindowControlIcon name={box.mode === "minimized" ? "restore" : "close"} /></button>
            <button type="button" onClick={() => setMode(box.mode === "fullscreen" ? "normal" : "fullscreen")} aria-label={box.mode === "fullscreen" ? `Exit full screen ${title}` : `Open ${title} full screen`} title={box.mode === "fullscreen" ? `Exit full screen ${title}` : `Open ${title} full screen`}><WindowControlIcon name="fullscreen" /></button>
            <button type="button" className={styles.moveButton} disabled={!canFreeform} onPointerDown={beginControlDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} aria-label={`Move ${title}`} title={canFreeform ? `Move ${title}` : `Move ${title} (desktop only)`}><WindowControlIcon name="move" /></button>
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
          onPointerMove={(moveEvent) => moveResize(moveEvent.nativeEvent)}
          onPointerUp={(upEvent) => finishResize(upEvent.nativeEvent.pointerId)}
          onPointerCancel={(cancelEvent) => finishResize(cancelEvent.nativeEvent.pointerId)}
          onMouseDown={beginMouseResize(direction)}
        />
      ))}
    </article>
  );
}
