"use client";

import type { BoxState, ExploreContentBox, ExploreContentRegistry, JourneyStation, ViewportMode } from "../../core/types";
import type { ResolvedWorkspaceManifest } from "../../core/workspaceManifest";
import styles from "./WorkspaceTopRail.module.css";

const STAGES: ReadonlyArray<{ id: JourneyStation; label: string; detail: string; icon: string }> = [
  { id: "region", label: "Region", detail: "Atlas", icon: "⌖" },
  { id: "rock", label: "Rock", detail: "Panorama", icon: "◔" },
  { id: "sector", label: "Sector", detail: "Routes", icon: "⌁" },
  { id: "topo", label: "Topo", detail: "Route detail", icon: "M" },
] as const;

const STATION_BY_BOX_ID: Record<string, JourneyStation> = {
  "crag-locator": "region",
  "wall-reveal": "rock",
  "nasenwand-spatial": "sector",
  "nasenwand-model": "topo",
};

function requestStation(station: JourneyStation) {
  window.dispatchEvent(new CustomEvent("vm:preview-station-request", { detail: { station } }));
}

export function WorkspaceTopRail({
  registry: _registry,
  workspace: _workspace,
  boxes: _boxes,
  activeBoxId: _activeBoxId,
  stationContent,
  viewportMode,
  onOpenBox: _onOpenBox,
  onSearch,
  onContribute: _onContribute,
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
  const station = stationContent ? STATION_BY_BOX_ID[stationContent.id] ?? "region" : "region";
  const stationIndex = STAGES.findIndex((candidate) => candidate.id === station);

  const flyTo = (next: JourneyStation) => {
    if (!followJourney) onToggleJourney();
    requestStation(next);
  };

  return (
    <header className={styles.chrome} data-viewport={viewportMode}>
      <nav className={styles.rail} aria-label={`${viewportMode === "tablet" ? "Tablet" : "Desktop"} Explore journey`}>
        {STAGES.map((candidate, index) => (
          <button
            key={candidate.id}
            type="button"
            className={styles.stage}
            data-current={candidate.id === station ? "true" : "false"}
            data-passed={index < stationIndex ? "true" : "false"}
            aria-current={candidate.id === station ? "step" : undefined}
            onClick={() => flyTo(candidate.id)}
          >
            <span className={styles.icon} aria-hidden="true">{candidate.icon}</span>
            <span className={styles.copy}>
              <strong>{candidate.label}</strong>
              <small>{candidate.detail}</small>
            </span>
          </button>
        ))}
        <button type="button" className={styles.search} onClick={onSearch} aria-label="Search the Explore workspace">
          <span className={styles.searchIcon} aria-hidden="true">⌕</span>
          <span className={styles.copy}>
            <strong>Search</strong>
            <small>Ctrl K</small>
          </span>
        </button>
      </nav>
    </header>
  );
}
