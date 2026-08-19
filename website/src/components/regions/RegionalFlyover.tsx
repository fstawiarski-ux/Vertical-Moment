"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type WheelEvent } from "react";
import type { RegionalPreviewManifest, RegionalPreviewNode } from "../../core/pilotTypes";
import styles from "./RegionalFlyover.module.css";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

function nodePositions(manifest: RegionalPreviewManifest) {
  const latitudes = manifest.nodes.map((node) => node.coordinate.latitude);
  const longitudes = manifest.nodes.map((node) => node.coordinate.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const latSpan = Math.max(0.0001, maxLat - minLat);
  const lonSpan = Math.max(0.0001, maxLon - minLon);

  return new Map(manifest.nodes.map((node) => [node.id, {
    x: 12 + ((node.coordinate.longitude - minLon) / lonSpan) * 76,
    y: 12 + (1 - (node.coordinate.latitude - minLat) / latSpan) * 76,
  }]));
}

function RegionalNodeScrub({ node }: { node: RegionalPreviewNode }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setUnlocked(false);
    setProgress(0);
  }, [node.id]);

  const moveTo = (value: number) => {
    const next = clamp(value);
    setProgress(next);
    const video = videoRef.current;
    if (!video) return;
    const duration = Number.isFinite(video.duration) && video.duration > 0
      ? video.duration
      : node.media.duration ?? 0;
    if (duration > 0) {
      try { video.currentTime = next * Math.max(0, duration - 1 / 30); } catch { /* metadata can still be settling */ }
    }
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!unlocked) return;
    event.preventDefault();
    moveTo(progress + event.deltaY * 0.0008);
  };

  return (
    <section className={styles.mediaCard} onWheel={onWheel} aria-label={`${node.label} regional media`}>
      <div className={styles.mediaStage}>
        <img src={node.media.poster} alt={`${node.label} preview poster`} />
        {unlocked && node.media.video && (
          <video
            ref={videoRef}
            src={node.media.video}
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={() => moveTo(progress)}
            aria-label={node.media.label}
          />
        )}
        <div className={styles.mediaShade} />
        <span className={styles.mediaBadge} data-state={node.media.state}>{node.media.state.replace("-", " ")}</span>
        {!unlocked && (
          <button
            type="button"
            className={styles.unlock}
            onClick={() => setUnlocked(true)}
            disabled={!node.media.video}
          >
            {node.media.video ? "Load this node’s scrub" : "Scrub source not attached"}
          </button>
        )}
      </div>
      <div className={styles.scrubControls} data-enabled={unlocked && node.media.video ? "true" : "false"}>
        <label htmlFor={`regional-scrub-${node.id}`}>Scrub selected node</label>
        <input
          id={`regional-scrub-${node.id}`}
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress * 100}
          disabled={!unlocked || !node.media.video}
          onInput={(event) => moveTo(Number(event.currentTarget.value) / 100)}
        />
        <output>{Math.round(progress * 100)}%</output>
      </div>
    </section>
  );
}

export function RegionalFlyover({ manifest, activePilotId, onSelectPilot }: {
  manifest: RegionalPreviewManifest;
  activePilotId: string | null;
  onSelectPilot: (pilotId: string) => void;
}) {
  const initialNode = manifest.nodes.find((node) => node.pilotId === activePilotId)
    ?? manifest.nodes.find((node) => node.id === manifest.defaultNode)
    ?? manifest.nodes[0];
  const [activeNodeId, setActiveNodeId] = useState(initialNode.id);
  const [open, setOpen] = useState(true);
  const positions = useMemo(() => nodePositions(manifest), [manifest]);
  const activeNode = manifest.nodes.find((node) => node.id === activeNodeId) ?? initialNode;
  const activePosition = positions.get(activeNode.id) ?? { x: 50, y: 50 };
  const cameraStyle = {
    "--camera-x": `${50 - activePosition.x}%`,
    "--camera-y": `${50 - activePosition.y}%`,
    "--camera-scale": activeNode.role === "spoke" || activeNode.role === "extension" ? "1.28" : "1.5",
  } as CSSProperties;

  useEffect(() => {
    const match = manifest.nodes.find((node) => node.pilotId === activePilotId);
    if (match) setActiveNodeId(match.id);
  }, [activePilotId, manifest.nodes]);

  const selectNode = (node: RegionalPreviewNode) => {
    setActiveNodeId(node.id);
    if (node.pilotId) onSelectPilot(node.pilotId);
  };

  if (!open) {
    return (
      <button type="button" className={styles.reopen} onClick={() => setOpen(true)}>
        <span>Regional map</span>
        <strong>{manifest.label}</strong>
      </button>
    );
  }

  return (
    <aside className={styles.overlay} aria-label={`${manifest.label} interactive regional map`}>
      <header className={styles.header}>
        <div>
          <small>{manifest.eyebrow}</small>
          <h1>{manifest.label}</h1>
          <p>{manifest.summary}</p>
        </div>
        <button type="button" className={styles.enter} onClick={() => setOpen(false)}>
          Enter five-box pilot
        </button>
      </header>

      <div className={styles.layout}>
        <section className={styles.mapCard} aria-label="GPS topology and camera transitions">
          <div className={styles.mapMeta}>
            <span>GPS topology</span>
            <strong>Map-camera prototype</strong>
          </div>
          <div className={styles.viewport}>
            <div className={styles.terrain} style={cameraStyle}>
              <div className={styles.corridor} />
            </div>
            <div className={styles.nodeLayer}>
              {manifest.nodes.map((node) => {
                const position = positions.get(node.id) ?? { x: 50, y: 50 };
                const selected = node.id === activeNode.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={styles.node}
                    data-role={node.role}
                    data-selected={selected ? "true" : "false"}
                    style={{ left: `${position.x}%`, top: `${position.y}%` }}
                    aria-pressed={selected}
                    onClick={() => selectNode(node)}
                  >
                    <i />
                    <span>{node.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <p className={styles.mapNote}>Transitions are map motion between GPS anchors. Separate clips remain separate flights.</p>
        </section>

        <div className={styles.detailColumn}>
          <RegionalNodeScrub key={activeNode.id} node={activeNode} />
          <section className={styles.nodeInfo}>
            <div>
              <small>{activeNode.role} node</small>
              <h2>{activeNode.label}</h2>
              <p>{activeNode.relationship}</p>
            </div>
            <dl>
              <div><dt>GPS</dt><dd>{activeNode.coordinate.latitude.toFixed(5)}, {activeNode.coordinate.longitude.toFixed(5)}</dd></div>
              <div><dt>Routes</dt><dd>{activeNode.routeCount ?? "Not resolved"}</dd></div>
              <div><dt>Media</dt><dd>{activeNode.media.availability.replace("-", " ")}</dd></div>
            </dl>
            <p className={styles.provenance}>{activeNode.media.note}</p>
            {activeNode.pilotId && (
              <button type="button" className={styles.pilotButton} onClick={() => setOpen(false)}>
                Open {activeNode.shortLabel} in the five boxes
              </button>
            )}
          </section>
        </div>
      </div>
    </aside>
  );
}
