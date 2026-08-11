"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type { ScrollScrubAsset } from "../../core/types";
import styles from "./ScrollScrubHero.module.css";

const FALLBACK_DURATION = 110 / 30;
const clamp = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Locked-canvas adaptation of the existing Nasenwand scroll scrub.
 * The original /nasenwand-concepts implementation remains intact; this module
 * uses the same verified all-keyframe orbit and seeking behaviour without
 * requiring document scrolling inside the app shell.
 */
export function ScrollScrubHero({ asset, visible }: { asset: ScrollScrubAsset; visible: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const dragRef = useRef<{ pointerId: number; y: number; progress: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !started) return;
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : FALLBACK_DURATION;
    const seek = progress * duration;
    if (Math.abs(video.currentTime - seek) > 0.025) {
      try {
        video.currentTime = seek;
      } catch {
        // Metadata can still be loading during the first scrub gesture.
      }
    }
  }, [progress, ready, started]);

  const moveTo = (next: number) => {
    setStarted(true);
    setProgress(clamp(next));
  };

  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    moveTo(progress + event.deltaY * 0.0007);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("input, button")) return;
    dragRef.current = { pointerId: event.pointerId, y: event.clientY, progress };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    moveTo(drag.progress + (drag.y - event.clientY) / Math.max(320, window.innerHeight * 0.72));
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  return (
    <section
      className={styles.hero}
      data-visible={visible ? "true" : "false"}
      aria-label="Nasenwand scroll-scrub hero"
      aria-hidden={!visible}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img className={styles.poster} src={asset.poster} alt="" aria-hidden="true" />
      {started && (
        <video
          ref={videoRef}
          className={styles.video}
          src={asset.video}
          poster={asset.poster}
          muted
          playsInline
          preload="metadata"
          aria-label={asset.alt}
          onLoadedMetadata={() => setReady(true)}
          onCanPlay={() => setReady(true)}
        />
      )}
      <div className={styles.veil} />
      <div className={styles.caption}>
        <small>Nasenwand · verified close-wall orbit</small>
        <strong>Scrub the wall</strong>
        <span>{started ? (ready ? "Drag, scroll or use the timeline" : "Preparing scrub…") : "Scroll or drag the background to begin"}</span>
        {!started && <button type="button" onClick={() => moveTo(0.12)}>Begin scrub</button>}
      </div>
      <label className={styles.timeline}>
        <span className={styles.visuallyHidden}>Scrub through the Nasenwand wall orbit</span>
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress * 100}
          onChange={(event) => moveTo(Number(event.target.value) / 100)}
          tabIndex={visible ? 0 : -1}
        />
        <output>{Math.round(progress * 100)}%</output>
      </label>
    </section>
  );
}
