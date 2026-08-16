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
import type {
  IntroMode,
  JourneyStation,
  ScrubStationEventDetail,
  ScrubStationSource,
  ScrollScrubSequenceAsset,
} from "../../core/types";
import { stationFlightDuration, stationForProgress } from "../../core/stationPresentation";
import styles from "./IntroScrubSequence.module.css";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const CHAPTER_BLEND_START = 0.86;
export const SCRUB_STATIONS: ReadonlyArray<{ id: JourneyStation; label: string; progress: number }> = [
  { id: "region", label: "Region", progress: 0 },
  { id: "rock", label: "Rock", progress: 1 / 3 },
  { id: "sector", label: "Sector", progress: 2 / 3 },
  { id: "topo", label: "Topo", progress: 1 },
] as const;

type ScrubStation = (typeof SCRUB_STATIONS)[number];
type DragAxis = "horizontal" | "vertical";

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  progress: number;
  axis: DragAxis | null;
}

const WHEEL_LINE_HEIGHT = 16;
const WHEEL_PROGRESS_SCALE = 0.00065;

function wheelDeltaInPixels(event: ReactWheelEvent<HTMLDivElement>) {
  if (event.deltaMode === 1) return event.deltaY * WHEEL_LINE_HEIGHT;
  if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

export type UnlockReason = "completed" | "skipped" | "static";

export function IntroScrubSequence({ sequence, mode, onUnlock, allowPostUnlockScrub = false, onFirstMove }: {
  sequence: ScrollScrubSequenceAsset;
  /** null while the visitor's intro preference is still being read. */
  mode: IntroMode | null;
  onUnlock: (reason: UnlockReason) => void;
  /** Lets a review shell keep the arrival footage alive behind its workspace. */
  allowPostUnlockScrub?: boolean;
  /** Fires once on the first meaningful scrub, drag, button or slider move. */
  onFirstMove?: () => void;
}) {
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const dragRef = useRef<DragState | null>(null);
  const progressRef = useRef(0);
  const flightFrameRef = useRef<number | null>(null);
  const unlockedRef = useRef(false);
  const firstMoveRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0, 1]));
  const lastAnnouncedStationRef = useRef<JourneyStation>("region");
  const suppressPreviewRef = useRef(false);
  const chapterCount = Math.max(1, sequence.chapters.length);
  const scaledProgress = Math.min(progress * chapterCount, chapterCount - 0.000001);
  const activeIndex = Math.floor(scaledProgress);
  const activeLocalProgress = scaledProgress - activeIndex;

  const resolved = mode !== null;
  const cinematic = mode === "cinematic";
  // Reduced-motion visitors keep the timeline, but it jumps rather than flies.
  const animateFlights = mode !== "static";

  const announceFirstMove = useCallback(() => {
    if (firstMoveRef.current) return;
    firstMoveRef.current = true;
    onFirstMove?.();
  }, [onFirstMove]);

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

  const unlock = useCallback((reason: UnlockReason) => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    setUnlocked(true);
    onUnlock(reason);
  }, [onUnlock]);

  const announceStation = useCallback((station: JourneyStation, phase: ScrubStationEventDetail["phase"], source: ScrubStationSource, nextProgress: number) => {
    const detail: ScrubStationEventDetail = { station, phase, source, progress: nextProgress };
    window.dispatchEvent(new CustomEvent<ScrubStationEventDetail>("vm:scrub-station", { detail }));
  }, []);

  const moveTo = useCallback((value: number, source: ScrubStationSource) => {
    if (source !== "static") announceFirstMove();
    const next = clamp(value);
    progressRef.current = next;
    setProgress(next);
    const station = stationForProgress(next);
    if (!suppressPreviewRef.current && station !== lastAnnouncedStationRef.current) {
      lastAnnouncedStationRef.current = station;
      announceStation(station, "preview", source, next);
    }
    if (next >= 0.995) unlock("completed");
  }, [announceFirstMove, announceStation, unlock]);

  const cancelFlight = useCallback(() => {
    if (flightFrameRef.current !== null) cancelAnimationFrame(flightFrameRef.current);
    flightFrameRef.current = null;
    suppressPreviewRef.current = false;
  }, []);

  useEffect(() => cancelFlight, [cancelFlight]);

  // A static intro holds the arrival frame and hands over the workspace at once.
  useEffect(() => {
    if (mode !== "static") return;
    cancelFlight();
    progressRef.current = 1;
    setProgress(1);
    lastAnnouncedStationRef.current = "topo";
    announceStation("topo", "arrived", "static", 1);
    unlock("static");
  }, [announceStation, cancelFlight, mode, unlock]);

  const flyToStation = useCallback((station: ScrubStation) => {
    cancelFlight();
    suppressPreviewRef.current = true;
    // Change the presentation at click time, not only after the easing flight
    // arrives. This lets the previous box recede while the scrub media moves.
    lastAnnouncedStationRef.current = station.id;
    announceStation(station.id, "preview", "button", station.progress);
    const from = progressRef.current;
    const distance = Math.abs(station.progress - from);
    const announceArrival = () => {
      suppressPreviewRef.current = false;
      announceStation(station.id, "arrived", "button", station.progress);
    };

    if (distance < 0.001 || !animateFlights) {
      moveTo(station.progress, "button");
      announceArrival();
      return;
    }

    const startedAt = performance.now();
    const duration = stationFlightDuration(distance);
    const tick = (now: number) => {
      const elapsed = clamp((now - startedAt) / duration);
      const eased = elapsed < 0.5
        ? 4 * elapsed * elapsed * elapsed
        : 1 - Math.pow(-2 * elapsed + 2, 3) / 2;
      moveTo(from + (station.progress - from) * eased, "button");
      if (elapsed < 1) {
        flightFrameRef.current = requestAnimationFrame(tick);
      } else {
        flightFrameRef.current = null;
        announceArrival();
      }
    };

    flightFrameRef.current = requestAnimationFrame(tick);
  }, [animateFlights, announceStation, cancelFlight, moveTo]);

  useEffect(() => {
    const onStationRequest = (event: Event) => {
      // Station-flight requests belong to onboarding. Once unlocked, the only
      // supported way to make the hero move again is an explicit Replay, which
      // remounts this sequence in its locked/cinematic phase.
      if (unlockedRef.current && !allowPostUnlockScrub) return;
      const detail = (event as CustomEvent<{ station?: JourneyStation }>).detail;
      const target = detail?.station
        ? SCRUB_STATIONS.find((candidate) => candidate.id === detail.station)
        : null;
      if (target) flyToStation(target);
    };
    window.addEventListener("vm:preview-station-request", onStationRequest);
    return () => window.removeEventListener("vm:preview-station-request", onStationRequest);
  }, [allowPostUnlockScrub, flyToStation]);

  const skip = useCallback(() => {
    cancelFlight();
    // Claim the unlock first so moveTo does not report this as a completed run.
    unlock("skipped");
    progressRef.current = 1;
    setProgress(1);
    lastAnnouncedStationRef.current = "topo";
    announceStation("topo", "arrived", "skip", 1);
  }, [announceStation, cancelFlight, unlock]);

  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (unlocked && !allowPostUnlockScrub) return;
    event.preventDefault();
    cancelFlight();
    moveTo(progressRef.current + wheelDeltaInPixels(event) * WHEEL_PROGRESS_SCALE, "wheel");
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((unlocked && !allowPostUnlockScrub) || (event.target as Element).closest("input, button")) return;
    cancelFlight();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      progress: progressRef.current,
      axis: null,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = drag.startX - event.clientX;
    const deltaY = drag.startY - event.clientY;
    if (!drag.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= 4) {
      drag.axis = Math.abs(deltaY) > Math.abs(deltaX) ? "vertical" : "horizontal";
    }
    if (!drag.axis) return;
    const delta = drag.axis === "vertical" ? deltaY : deltaX;
    const viewportSize = drag.axis === "vertical" ? window.innerHeight : window.innerWidth;
    moveTo(drag.progress + delta / Math.max(320, viewportSize * 0.86), "drag");
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
    <section
      className={styles.sequence}
      data-unlocked={unlocked ? "true" : "false"}
      data-scrub-live={allowPostUnlockScrub ? "true" : "false"}
      aria-label="Wachau approach scrub sequence"
    >
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
        {cinematic && !unlocked && (
          <div className={styles.introCopy}>
            <small>Wachau · three-stage approach</small>
            <strong>Move from region to the wall</strong>
        <span>Drag sideways, swipe vertically, scroll, or use the timeline.</span>
            <button type="button" className={styles.skip} onClick={skip}>
              {progress > 0.9 ? "Enter workspace" : "Skip to workspace"}
            </button>
          </div>
        )}
      </div>

      {resolved && (!unlocked || allowPostUnlockScrub) && (
        <div className={styles.timeline} data-unlocked={unlocked ? "true" : "false"}>
          <label className={styles.visuallyHidden} htmlFor="explore-intro-timeline">Move from Region on the left to Topo on the right</label>
          <span className={styles.chapterLabels} aria-label="Scrub stations, Region to Rock to Sector to Topo">
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
                aria-label="Move from Region on the left to Topo on the right"
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress * 100}
              onPointerDown={cancelFlight}
              onChange={(event) => {
                cancelFlight();
                moveTo(Number(event.target.value) / 100, "slider");
              }}
            />
            <output>{Math.round(progress * 100)}%</output>
          </span>
        </div>
      )}
    </section>
  );
}
