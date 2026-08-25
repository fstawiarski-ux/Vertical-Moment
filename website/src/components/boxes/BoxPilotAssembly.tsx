"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { ExploreImageAsset, ExploreModelAsset } from "../../core/types";
import type { ExplorePilotManifest, PilotAssetKey, PilotModuleBackground, PilotModuleKey } from "../../core/pilotTypes";
import { useScrubVideoSource } from "../../hooks/useScrubVideoSource";
import { Box3DModel } from "./Box3DModel";
import styles from "./BoxPilotAssembly.module.css";

const STATUS_LABEL = { missing: "Awaiting upload", review: "In review", ready: "Ready" } as const;

function AssetSlot({ pilot, assetKey }: { pilot: ExplorePilotManifest; assetKey: PilotAssetKey }) {
  const slot = pilot.assets[assetKey];
  const [requested, setRequested] = useState(false);
  const isVisual = slot.kind === "image" || slot.kind === "panorama";
  const source = slot.status === "ready" ? slot.src : slot.preview?.src ?? null;
  const isPreview = slot.status !== "ready" && Boolean(slot.preview);

  return (
    <article className={styles.slot} data-status={slot.status} data-preview={isPreview ? "true" : "false"}>
      <header>
        <span>{assetKey.replace(/([A-Z])/g, " $1")}</span>
        <strong>{isPreview ? "Beta preview" : STATUS_LABEL[slot.status]}</strong>
      </header>
      {source && isVisual && (
        <img src={source} alt={slot.alt} loading="lazy" />
      )}
      {source && slot.kind === "link" && (
        <a href={source} target="_blank" rel="noreferrer">Open reference panorama</a>
      )}
      {source && slot.kind === "video" && (
        requested
          ? <video src={source} controls muted playsInline preload="metadata" aria-label={slot.alt} />
          : <button type="button" onClick={() => setRequested(true)}>Load preview</button>
      )}
      {!source && (
        <div className={styles.placeholder} aria-label={`${assetKey} asset slot ${slot.status}`}>
          <span>{slot.kind}</span>
          <code>{slot.targetPath}</code>
        </div>
      )}
      {slot.note && <p>{slot.note}</p>}
    </article>
  );
}

function ModelSlot({ pilot, isActive }: { pilot: ExplorePilotManifest; isActive: boolean }) {
  const modelSlot = pilot.assets.model;
  const posterSlot = pilot.assets.spatial.status === "ready" ? pilot.assets.spatial : pilot.assets.hero;
  const modelSource = modelSlot.status === "ready" ? modelSlot.src : modelSlot.preview?.src ?? null;
  if (!modelSource || !modelSlot.bytes) {
    return <AssetSlot pilot={pilot} assetKey="model" />;
  }
  const model: ExploreModelAsset = { src: modelSource, bytes: modelSlot.bytes };
  const poster: ExploreImageAsset | undefined = posterSlot.status === "ready" && posterSlot.src
    ? { src: posterSlot.src, alt: posterSlot.alt, width: 1280, height: 960, sizes: "100vw" }
    : undefined;
  return (
    <div className={styles.model} data-preview={modelSlot.status === "ready" ? "false" : "true"}>
      <p className={styles.previewLabel}>{modelSlot.status === "ready" ? "Interactive 3D" : "Beta preview · replaceable"}</p>
      <Box3DModel model={model} poster={poster} isActive={isActive} label={pilot.identity.crag} intentOnly />
      {modelSlot.note && <p className={styles.previewNote}>{modelSlot.note}</p>}
    </div>
  );
}

function ModuleScrubBackground({ background, isActive }: { background: PilotModuleBackground; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [progress, setProgress] = useState(0);
  const mediaSource = useScrubVideoSource(background.src, isActive);
  const mediaReady = mediaSource.status === "ready";

  const seek = useCallback((nextProgress: number) => {
    const next = Math.max(0, Math.min(1, nextProgress));
    setProgress(next);
    const video = videoRef.current;
    if (!video || video.readyState < 1) return;
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : background.duration;
    const target = next * Math.max(0, duration - 1 / 30);
    if (Math.abs(video.currentTime - target) > 0.02) {
      try { video.currentTime = target; } catch { /* metadata can still be settling */ }
    }
  }, [background.duration]);

  useEffect(() => {
    if (isActive && mediaReady) seek(progress);
  }, [isActive, mediaReady, progress, seek]);

  const seekFromPointer = useCallback((event: ReactPointerEvent<HTMLLabelElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    seek((event.clientX - bounds.left) / Math.max(1, bounds.width));
  }, [seek]);

  return (
    <>
      <div className={styles.moduleBackground} aria-hidden="true">
        <img src={background.poster} alt="" />
        {isActive && mediaSource.src && (
          <video
            ref={videoRef}
            src={mediaSource.src}
            poster={background.poster}
            muted
            playsInline
            preload="metadata"
            style={{ objectPosition: background.objectPosition ?? "center" }}
            onLoadedMetadata={() => seek(progress)}
          />
        )}
        <span />
      </div>
      <label
        className={styles.backgroundScrubber}
        onPointerDown={(event) => {
          if (!isActive || !mediaReady) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          seekFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (isActive && mediaReady && event.currentTarget.hasPointerCapture(event.pointerId)) seekFromPointer(event);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
      >
        <span>{mediaSource.status === "loading" ? "Preparing the 720p Däumling scrub…" : "Slide through the Däumling formation"}</span>
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress * 100}
          disabled={!isActive || !mediaReady}
          aria-label="Scrub the Däumling routes background"
          onChange={(event) => seek(Number(event.target.value) / 100)}
        />
      </label>
    </>
  );
}

export function BoxPilotAssembly({ pilot, moduleKey, isActive }: { pilot: ExplorePilotManifest; moduleKey: PilotModuleKey; isActive: boolean }) {
  const module = pilot.modules[moduleKey];
  const slots = useMemo(() => module.primarySlots, [module.primarySlots]);

  return (
    <div className={styles.assembly} data-has-background={module.background ? "true" : "false"}>
      {module.background && <ModuleScrubBackground background={module.background} isActive={isActive} />}
      <header className={styles.intro}>
        <div>
          <small>{pilot.identity.region} / {pilot.identity.crag}</small>
          <h3>{module.title}</h3>
        </div>
        <span data-state={pilot.releaseState}>{pilot.releaseState}</span>
      </header>
      <p className={styles.description}>{module.description}</p>

      {moduleKey === "routes" && (
        <dl className={styles.facts}>
          <div><dt>Routes</dt><dd>{pilot.summary.routeCount ?? "Pending"}</dd></div>
          <div><dt>Grades</dt><dd>{pilot.summary.gradeRange ?? "Pending"}</dd></div>
          <div><dt>System</dt><dd>{pilot.summary.gradeSystem ?? "Pending"}</dd></div>
          <div><dt>Status</dt><dd>{pilot.provenance.confidence}</dd></div>
        </dl>
      )}

      <section className={styles.slots} aria-label={`${module.title} asset slots`}>
        {slots.map((assetKey) => assetKey === "model"
          ? <ModelSlot key={assetKey} pilot={pilot} isActive={isActive} />
          : <AssetSlot key={assetKey} pilot={pilot} assetKey={assetKey} />)}
        {slots.length === 0 && !module.background && (
          <div className={styles.dataReady}>
            <strong>Canonical locator stays shared</strong>
            <p>This box continues to use the common region and crag index. Pilot-specific map styling can be added without duplicating the atlas.</p>
          </div>
        )}
      </section>

      <footer>
        <span>{pilot.label}</span>
        <span>{pilot.provenance.dataPath ?? "Data path pending"}</span>
      </footer>
    </div>
  );
}
