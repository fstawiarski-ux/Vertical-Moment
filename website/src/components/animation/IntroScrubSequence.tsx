"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type { ScrollScrubSequenceAsset } from "../../core/types";
import styles from "./IntroScrubSequence.module.css";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const CHAPTER_BLEND_START = 0.86;
const SCRUB_STATIONS = [
  { id: "topo", label: "Topo", progress: 1 },
  { id: "sector", label: "Sector", progress: 2 / 3 },
  { id: "rock", label: "Rock", progress: 1 / 3 },
  { id: "region", label: "Region", progress: 0 },
] as const;

type ScrubStation = (typeof SCRUB_STATIONS)[number];

export function IntroScrubSequence({ sequence, onUnlock }: { sequence: ScrollScrubSequenceAsset; onUnlock: () => void }) {
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const dragRef = useRef<{ pointerId: number; x: number; progress: number } | null>(null);
  const progressRef = useRef(0);
  const flightFrameRef = useRef<number | null>(null);
  const unlockedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0, 1]));
  const chapterCount = Math.max(1, sequence.chapters.length);
  const scaledProgress = Math.min(progress * chapterCount, chapterCount - 0.000001);
  const activeIndex = Math.floor(scaledProgress);
  const activeLocalProgress = scaledProgress - activeIndex;

  useEffect(() => {
    setLoaded((current) => {
      const next = new Set(current);
      next.add(activeIndex);
      if (activeIndex > 0) next.add(activeIndex - 1);
      if (activeIndex < chapterCount - 1) next.add(activeIndex + 1);
      return next.size === current.size ? current : next;
    });
  }, [activeIndex, chapterCount]);

  const syncVideos = useCallback((nextProgress: number) => {
    sequence.chapters.forEach((chapter, index) => {
      const video = videoRefs.current[index];
      if (!video || video.readyState < 1) return;
      const localProgress = clamp(nextProgress * chapterCount - index);
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : chapter.duration;
      const target = chapter.direction === "reverse"
        ? (1 - localProgress) * Math.max(0, duration - 1 / 30)
        : localProgress * Math.max(0, duration - 1 / 30);
      if (Math.abs(video.currentTime - target) > 0.02) {
        try { video.currentTime = target; } catch { /* metadata can still be settling */ }
      }
    });
  }, [chapterCount, sequence.chapters]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => syncVideos(progress));
    return () => cancelAnimationFrame(frame);
  }, [progress, syncVideos]);

  const moveTo = useCallback((value: number) => {
    const next = clamp(value);
    progressRef.current = next;
    setProgress(next);
    if (next >= 0.995 && !unlockedRef.current) {
      unlockedRef.current = true;
      setUnlocked(true);
      onUnlock();
    }
  }, [onUnlock]);

  const cancelFlight = useCallback(() => {
    if (flightFrameRef.current !== null) cancelAnimationFrame(flightFrameRef.current);
    flightFrameRef.current = null;
  }, []);

  useEffect(() => cancelFlight, [cancelFlight]);

  const flyToStation = useCallback((station: ScrubStation) => {
    cancelFlight();
    const from = progressRef.current;
    const distance = Math.abs(station.progress - from);
    const announceArrival = () => window.dispatchEvent(new CustomEvent("vm:scrub-station", {
      detail: { station: station.id, progress: station.progress },
    }));

    if (distance < 0.001) {
      moveTo(station.progress);
      announceArrival();
      return;
    }

    const startedAt = performance.now();
    const duration = 650 + distance * 1350;
    const tick = (now: number) => {
      const elapsed = clamp((now - startedAt) / duration);
      const eased = elapsed < 0.5
        ? 4 * elapsed * elapsed * elapsed
        : 1 - Math.pow(-2 * elapsed + 2, 3) / 2;
      moveTo(from + (station.progress - from) * eased);
      if (elapsed < 1) {
        flightFrameRef.current = requestAnimationFrame(tick);
      } else {
        flightFrameRef.current = null;
        announceArrival();
      }
    };

    flightFrameRef.current = requestAnimationFrame(tick);
  }, [cancelFlight, moveTo]);

  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (unlocked) return;
    event.preventDefault();
    cancelFlight();
    moveTo(progress + event.deltaY * 0.00065);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (unlocked || (event.target as Element).closest("input")) return;
    cancelFlight();
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, progress };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    moveTo(drag.progress + (drag.x - event.clientX) / Math.max(320, window.innerWidth * 0.86));
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  const chapterOpacities = useMemo(() => sequence.chapters.map((_, index) => {
    if (index === activeIndex) {
      if (activeIndex < chapterCount - 1 && activeLocalProgress > CHAPTER_BLEND_START) {
        return 1 - (activeLocalProgress - CHAPTER_BLEND_START) / (1 - CHAPTER_BLEND_START);
      }
      return 1;
    }
    if (index === activeIndex + 1 && activeLocalProgress > CHAPTER_BLEND_START) {
      return (activeLocalProgress - CHAPTER_BLEND_START) / (1 - CHAPTER_BLEND_START);
    }
    return 0;
  }), [activeIndex, activeLocalProgress, chapterCount, sequence.chapters]);

  return (
    <section className={styles.sequence} data-unlocked={unlocked ? "true" : "false"} aria-label="Wachau approach scrub sequence">
      <div className={styles.media} aria-hidden="true">
        <img className={styles.poster} src={sequence.poster} alt="" />
        {sequence.chapters.map((chapter, index) => loaded.has(index) && (
          <video
            key={chapter.id}
            ref={(node) => { videoRefs.current[index] = node; }}
            className={styles.video}
            src={chapter.video}
            muted
            playsInline
            preload={index === 0 ? "auto" : "metadata"}
            style={{ opacity: chapterOpacities[index], objectPosition: chapter.objectPosition ?? "center" }}
            onLoadedMetadata={() => syncVideos(progress)}
            aria-label={chapter.alt}
          />
        ))}
        <div className={styles.veil} />
      </div>

      <div
        className={styles.gestureLayer}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {!unlocked && (
          <div className={styles.introCopy}>
            <small>Wachau · three-stage approach</small>
            <strong>Move from region to the wall</strong>
            <span>Drag from right to left, scroll, or use the timeline.</span>
          </div>
        )}
      </div>

      <div className={styles.timeline}>
        <label className={styles.visuallyHidden} htmlFor="explore-intro-timeline">Move from Region on the right to Topo on the left</label>
        <span className={styles.chapterLabels} aria-label="Scrub stations">
          {SCRUB_STATIONS.map((station) => (
            <button
              key={station.id}
              type="button"
              aria-label={`Fly to ${station.label}`}
              aria-current={Math.abs(progress - station.progress) < 0.015 ? "step" : undefined}
              onClick={() => flyToStation(station)}
            >
              {station.label}
            </button>
          ))}
        </span>
        <span className={styles.trackRow}>
          <input
            id="explore-intro-timeline"
            aria-label="Move from Region on the right to Topo on the left"
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress * 100}
            onPointerDown={cancelFlight}
            onChange={(event) => {
              cancelFlight();
              moveTo(Number(event.target.value) / 100);
            }}
          />
          <output>{Math.round(progress * 100)}%</output>
        </span>
      </div>
    </section>
  );
}
