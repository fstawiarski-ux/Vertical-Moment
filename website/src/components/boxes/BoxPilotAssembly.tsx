"use client";

import { useMemo, useState } from "react";
import type { ExploreImageAsset, ExploreModelAsset } from "../../core/types";
import type { ExplorePilotManifest, PilotAssetKey, PilotModuleKey } from "../../core/pilotTypes";
import { Box3DModel } from "./Box3DModel";
import styles from "./BoxPilotAssembly.module.css";

const STATUS_LABEL = { missing: "Awaiting upload", review: "In review", ready: "Ready" } as const;

function AssetSlot({ pilot, assetKey }: { pilot: ExplorePilotManifest; assetKey: PilotAssetKey }) {
  const slot = pilot.assets[assetKey];
  const [requested, setRequested] = useState(false);
  const isVisual = slot.kind === "image" || slot.kind === "panorama";

  return (
    <article className={styles.slot} data-status={slot.status}>
      <header>
        <span>{assetKey.replace(/([A-Z])/g, " $1")}</span>
        <strong>{STATUS_LABEL[slot.status]}</strong>
      </header>
      {slot.status === "ready" && slot.src && isVisual && (
        <img src={slot.src} alt={slot.alt} loading="lazy" />
      )}
      {slot.status === "ready" && slot.src && slot.kind === "link" && (
        <a href={slot.src} target="_blank" rel="noreferrer">Open 360 view</a>
      )}
      {slot.status === "ready" && slot.src && slot.kind === "video" && (
        requested
          ? <video src={slot.src} controls muted playsInline preload="metadata" aria-label={slot.alt} />
          : <button type="button" onClick={() => setRequested(true)}>Load preview</button>
      )}
      {slot.status !== "ready" && (
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
  if (modelSlot.status !== "ready" || !modelSlot.src || !modelSlot.bytes) {
    return <AssetSlot pilot={pilot} assetKey="model" />;
  }
  const model: ExploreModelAsset = { src: modelSlot.src, bytes: modelSlot.bytes };
  const poster: ExploreImageAsset | undefined = posterSlot.status === "ready" && posterSlot.src
    ? { src: posterSlot.src, alt: posterSlot.alt, width: 1280, height: 960, sizes: "100vw" }
    : undefined;
  return <div className={styles.model}><Box3DModel model={model} poster={poster} isActive={isActive} label={pilot.identity.crag} intentOnly /></div>;
}

export function BoxPilotAssembly({ pilot, moduleKey, isActive }: { pilot: ExplorePilotManifest; moduleKey: PilotModuleKey; isActive: boolean }) {
  const module = pilot.modules[moduleKey];
  const slots = useMemo(() => module.primarySlots, [module.primarySlots]);

  return (
    <div className={styles.assembly}>
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
        {slots.length === 0 && (
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
