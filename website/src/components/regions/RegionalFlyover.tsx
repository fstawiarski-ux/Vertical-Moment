"use client";

import { useEffect, useState } from "react";
import type { RegionalPreviewManifest, RegionalPreviewNode } from "../../core/pilotTypes";
import styles from "./RegionalFlyover.module.css";

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
  const activeNode = manifest.nodes.find((node) => node.id === activeNodeId) ?? initialNode;
  const regionTitle = manifest.label.replace(/\s+Phone Beta$/i, "");

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
        <span>Helenental region</span>
        <strong>{activeNode.shortLabel}</strong>
      </button>
    );
  }

  return (
    <aside className={styles.overlay} aria-label={`${regionTitle} full-screen scrub preview`}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <small>{manifest.eyebrow}</small>
          <h1>{activeNode.label}</h1>
          <p>{activeNode.relationship}</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.status}>
            {activeNode.media.state.replace("-", " ")} - private beta
          </span>
          <button
            type="button"
            className={styles.enter}
            aria-label={`Open ${activeNode.label} in the five-box pilot`}
            onClick={() => setOpen(false)}
          >
            Open five-box pilot
          </button>
        </div>
      </header>

      <section className={styles.spotPicker} role="group" aria-label={`${regionTitle} spot journeys`}>
        <div className={styles.pickerHeading}>
          <span>{regionTitle.toUpperCase()} SPOTS</span>
          <strong>Each spot brings its own full-screen scrub</strong>
        </div>
        <div className={styles.spotList}>
          {manifest.nodes.map((node, index) => {
            const selected = node.id === activeNode.id;
            const scrubAvailable = Boolean(node.pilotId && node.media.video);
            const duration = !scrubAvailable
              ? "Scrub source missing"
              : node.media.duration
              ? `${node.media.duration.toFixed(1)} sec`
              : "Scroll-scrub";
            return (
              <button
                key={node.id}
                type="button"
                className={styles.spot}
                data-selected={selected ? "true" : "false"}
                data-role={node.role}
                aria-pressed={selected}
                disabled={!scrubAvailable}
                onClick={() => selectNode(node)}
              >
                <span className={styles.spotNumber}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.spotRole}>{node.role} journey</span>
                <strong>{node.shortLabel}</strong>
                <span className={styles.spotMeta}>{duration}</span>
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
