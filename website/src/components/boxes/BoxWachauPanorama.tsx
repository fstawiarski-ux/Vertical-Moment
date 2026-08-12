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
import { panoramas, type Panorama } from "../../../app/data/panoramas";
import { dropLegacyPackCaches, RUNTIME_IMAGE_CACHE } from "../../pwa/offlineCache";
import styles from "./BoxWachauPanorama.module.css";

type ChapterId = "region" | "crag" | "sector" | "360";
type ImageSize = { width: number; height: number };

const CHAPTERS: Array<{ id: ChapterId; label: string; panoramaId?: string }> = [
  { id: "region", label: "Region", panoramaId: "wachau-09" },
  { id: "crag", label: "Crag", panoramaId: "wachau-14" },
  { id: "sector", label: "Sector", panoramaId: "wachau-15" },
  { id: "360", label: "360 deg" },
];

const GOOGLE_360_HREF = "https://maps.app.goo.gl/eXBK67PMrUGCVvsS7";
const GOOGLE_360_EMBED = "https://www.google.com/maps/embed?pb=!3m2!1sen!2sat!4v1786272580869!5m2!1sen!2sat!6m8!1m7!1sCAoSFkNJSE0wb2dLRUlDQWdJREUwcUNBTWc.!2m2!1d48.39575198431061!2d15.51663212296914!3f211.83674207632868!4f1.4136926584171903!5f0.7820865974627469";
// Shared with the app-shell pack: this is the cache the worker's image route
// reads, and the only one a page-saved asset can be served from offline.
const OFFLINE_CACHE = RUNTIME_IMAGE_CACHE;
const OFFLINE_ASSETS = panoramas.flatMap((panorama) => [panorama.src, panorama.thumbnail]);

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function PanoramaOfflinePack() {
  const [status, setStatus] = useState<"idle" | "checking" | "saving" | "ready" | "error">("checking");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!("caches" in window)) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    dropLegacyPackCaches();
    caches.open(OFFLINE_CACHE)
      .then(async (cache) => Promise.all(OFFLINE_ASSETS.map((asset) => cache.match(asset))))
      .then((matches) => {
        if (!cancelled) setStatus(matches.every(Boolean) ? "ready" : "idle");
      })
      .catch(() => { if (!cancelled) setStatus("idle"); });
    return () => { cancelled = true; };
  }, []);

  const save = async () => {
    if (!("caches" in window) || status === "saving") return;
    setStatus("saving");
    setProgress(0);
    try {
      const cache = await caches.open(OFFLINE_CACHE);
      for (let index = 0; index < OFFLINE_ASSETS.length; index += 1) {
        const asset = OFFLINE_ASSETS[index];
        if (!(await cache.match(asset))) {
          const response = await fetch(asset);
          if (!response.ok) throw new Error(`Panorama returned ${response.status}`);
          await cache.put(asset, response);
        }
        setProgress(Math.round(((index + 1) / OFFLINE_ASSETS.length) * 100));
      }
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  return (
    <button className={styles.offlinePack} type="button" onClick={save} disabled={status === "checking" || status === "saving" || status === "ready"}>
      {status === "checking" && "Checking offline pack..."}
      {status === "idle" && "Save offline - 10.3 MB"}
      {status === "saving" && `Saving - ${progress}%`}
      {status === "ready" && "Offline pack ready"}
      {status === "error" && "Retry offline pack"}
    </button>
  );
}

export default function BoxWachauPanorama() {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startPan: number } | null>(null);
  const [chapter, setChapter] = useState<ChapterId>("region");
  const [selectedId, setSelectedId] = useState("wachau-09");
  const [pan, setPan] = useState(0);
  const [stageSize, setStageSize] = useState<ImageSize>({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState<ImageSize>({ width: 6075, height: 737 });

  const selected = useMemo(
    () => panoramas.find((panorama) => panorama.id === selectedId) ?? panoramas[0],
    [selectedId],
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const updateSize = () => setStageSize({ width: stage.clientWidth, height: stage.clientHeight });
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [chapter]);

  useEffect(() => {
    setPan(0);
    setImageSize({ width: selected.displayWidth, height: selected.displayHeight });
  }, [selected]);

  const renderedSize = useMemo(() => {
    if (!stageSize.width || !stageSize.height || !imageSize.width || !imageSize.height) return { width: 0, height: 0, maxPan: 0 };
    const scale = Math.max(stageSize.width / imageSize.width, stageSize.height / imageSize.height);
    const width = imageSize.width * scale;
    const height = imageSize.height * scale;
    return { width, height, maxPan: Math.max(0, (width - stageSize.width) / 2) };
  }, [imageSize, stageSize]);

  useEffect(() => {
    setPan((current) => clamp(current, -renderedSize.maxPan, renderedSize.maxPan));
  }, [renderedSize.maxPan]);

  const chooseChapter = (next: ChapterId) => {
    setChapter(next);
    const panoramaId = CHAPTERS.find((item) => item.id === next)?.panoramaId;
    if (panoramaId) setSelectedId(panoramaId);
  };

  const choosePanorama = (panorama: Panorama) => {
    setSelectedId(panorama.id);
    setChapter(panorama.category === "wall-study" ? "sector" : "region");
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!renderedSize.maxPan) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startPan: pan };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPan(clamp(drag.startPan + event.clientX - drag.startX, -renderedSize.maxPan, renderedSize.maxPan));
  };

  const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  const handleWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    if (!renderedSize.maxPan) return;
    event.preventDefault();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    setPan((current) => clamp(current - delta, -renderedSize.maxPan, renderedSize.maxPan));
  }, [renderedSize.maxPan]);

  const sliderValue = renderedSize.maxPan
    ? Math.round(((pan + renderedSize.maxPan) / (renderedSize.maxPan * 2)) * 100)
    : 50;

  return (
    <div className={styles.experience}>
      <div className={styles.toolbar}>
        <nav aria-label="Panorama scale">
          {CHAPTERS.map((item) => (
            <button key={item.id} type="button" aria-pressed={chapter === item.id} onClick={() => chooseChapter(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <PanoramaOfflinePack />
      </div>

      {chapter === "360" ? (
        <section className={styles.sphere} aria-labelledby="wachau-360-title">
          <iframe
            src={GOOGLE_360_EMBED}
            title="Google Maps 360 degree drone view near Nasenwand"
            loading="lazy"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <div className={styles.sphereCaption}>
            <div>
              <small>Public Google sphere - online</small>
              <strong id="wachau-360-title">Nasenwand approach in 360 degrees</strong>
              <span>Your own 360 photography can replace or sit beside this view later.</span>
            </div>
            <a href={GOOGLE_360_HREF} target="_blank" rel="noreferrer">Open in Google Maps</a>
          </div>
        </section>
      ) : (
        <>
          <div
            ref={stageRef}
            className={styles.stage}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={stopDrag}
            onPointerCancel={stopDrag}
            onWheel={handleWheel}
            onDoubleClick={() => setPan(0)}
          >
            <img
              key={selected.id}
              src={selected.src}
              alt={selected.alt}
              draggable={false}
              onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
              style={{
                width: renderedSize.width || undefined,
                height: renderedSize.height || undefined,
                transform: `translate3d(calc(-50% + ${pan}px), -50%, 0)`,
              }}
            />
            <div className={styles.shade} aria-hidden="true" />
            <div className={styles.caption}>
              <small>{chapter} study - provisional regional reference</small>
              <strong>{selected.title}</strong>
              <span>{selected.description}</span>
            </div>
            <span className={styles.dragHint}>{renderedSize.maxPan ? "Drag or use the slider" : "Image fitted to view"}</span>
            <label className={styles.panSlider}>
              <span>Pan</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                disabled={!renderedSize.maxPan}
                onChange={(event) => setPan(((Number(event.target.value) / 100) * 2 - 1) * renderedSize.maxPan)}
              />
              <button type="button" onClick={() => setPan(0)}>Center</button>
            </label>
          </div>

          <div className={styles.gallery} aria-label="Wachau panorama studies">
            {panoramas.map((panorama) => (
              <button key={panorama.id} type="button" aria-pressed={panorama.id === selected.id} onClick={() => choosePanorama(panorama)}>
                <img src={panorama.thumbnail} alt="" loading="lazy" draggable={false} />
                <span>{panorama.title}</span>
              </button>
            ))}
          </div>
          <footer>{selected.referenceNote}</footer>
        </>
      )}
    </div>
  );
}
