"use client";

import { useState } from "react";
import type { BoxState, ExploreContentBox, ExploreContentRegistry, ViewportMode } from "../../core/types";
import type { ResolvedWorkspaceManifest } from "../../core/workspaceManifest";
import styles from "../../ExploreApp.module.css";

export function WorkspaceTopRail({
  registry,
  workspace,
  boxes,
  activeBoxId,
  stationContent,
  viewportMode,
  onOpenBox,
  onSearch,
  onContribute,
  onToggleJourney,
  followJourney,
}: {
  registry: ExploreContentRegistry;
  workspace: ResolvedWorkspaceManifest;
  boxes: BoxState[];
  activeBoxId: string | null;
  stationContent: ExploreContentBox | null;
  viewportMode: ViewportMode;
  onOpenBox: (id: string) => void;
  onSearch: () => void;
  onContribute: () => void;
  onToggleJourney: () => void;
  followJourney: boolean;
}) {
  const [modulesOpen, setModulesOpen] = useState(false);
  const selected = boxes.find((box) => box.id === activeBoxId && box.mode !== "minimized")
    ?? boxes.find((box) => box.mode !== "minimized")
    ?? boxes[0];
  const primary = workspace.phone.primaryModuleIds
    .map((id) => registry.boxes.find((content) => content.id === id))
    .filter((content): content is ExploreContentBox => Boolean(content));

  const openContent = (id: string) => {
    setModulesOpen(false);
    onOpenBox(id);
  };

  return (
    <header className={styles.workspaceTopChrome} data-viewport={viewportMode}>
      <nav className={styles.workspaceTopRail} aria-label={`${viewportMode === "tablet" ? "Tablet" : "Desktop"} Explore navigation`}>
        <button type="button" aria-pressed={followJourney} onClick={onToggleJourney}>Journey</button>
        {primary.map((content) => (
          <button
            key={content.id}
            type="button"
            aria-current={!followJourney && content.id === selected?.id ? "page" : undefined}
            onClick={() => openContent(content.id)}
          >
            {content.mobileLabel ?? content.title}
          </button>
        ))}
        <button
          type="button"
          aria-expanded={modulesOpen}
          aria-controls="large-screen-module-menu"
          onClick={() => setModulesOpen((value) => !value)}
        >
          Modules
        </button>
        <button type="button" onClick={onSearch} aria-label="Search the Explore workspace">Search</button>
      </nav>

      {modulesOpen && (
        <section className={styles.workspaceModuleMenu} id="large-screen-module-menu" aria-label="Explore modules">
          <header>
            <div>
              <small>Open intentionally</small>
              <strong>{stationContent?.title ?? "Explore modules"}</strong>
            </div>
            <button type="button" onClick={() => setModulesOpen(false)} aria-label="Close module menu">Close</button>
          </header>
          <div>
            {registry.boxes.map((content) => {
              const box = boxes.find((candidate) => candidate.id === content.id);
              const isCurrent = content.id === selected?.id;
              return (
                <button
                  key={content.id}
                  type="button"
                  aria-current={isCurrent ? "page" : undefined}
                  onClick={() => openContent(content.id)}
                >
                  <span>{content.mobileLabel ?? content.title}</span>
                  <small>{box?.mode === "minimized" ? "Open" : "Current"}</small>
                </button>
              );
            })}
            <button type="button" onClick={() => { setModulesOpen(false); onContribute(); }}>
              <span>Add contribution</span>
              <small>Field beta</small>
            </button>
          </div>
        </section>
      )}
    </header>
  );
}
