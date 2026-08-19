"use client";

import type { BoxState, ExploreContentBox, ExploreContentRegistry, JourneyStation, ViewportMode } from "../../core/types";
import type { ResolvedWorkspaceManifest } from "../../core/workspaceManifest";
import styles from "./WorkspaceTopRail.module.css";

const STAGES: ReadonlyArray<{ id: JourneyStation; boxId: string; label: string; detail: string; icon: string }> = [
  { id: "region", boxId: "crag-locator", label: "Region", detail: "Atlas", icon: "⌖" },
  { id: "rock", boxId: "wall-reveal", label: "Rock", detail: "Panorama", icon: "◔" },
  { id: "sector", boxId: "nasenwand-spatial", label: "Sector", detail: "Routes", icon: "⌁" },
  { id: "topo", boxId: "nasenwand-model", label: "Topo", detail: "Route detail", icon: "M" },
] as const;

const STATION_BY_BOX_ID: Record<string, JourneyStation> = Object.fromEntries(STAGES.map((stage) => [stage.boxId, stage.id])) as Record<string, JourneyStation>;

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
  void registry;
  void workspace;
  void boxes;
  void onContribute;
  void onToggleJourney;
  void followJourney;

  const currentBoxId = activeBoxId ?? stationContent?.id ?? "crag-locator";
  const station = STATION_BY_BOX_ID[currentBoxId] ?? "region";
  const stationIndex = STAGES.findIndex((candidate) => candidate.id === station);

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
            aria-current={candidate.id === station ? "page" : undefined}
            onClick={() => onOpenBox(candidate.boxId)}
            title={`Open ${candidate.detail} without replaying the journey`}
          >
            <span className={styles.icon} aria-hidden="true">{candidate.icon}</span>
            <span className={styles.copy}>
              <strong>{candidate.label}</strong>
              <small>{candidate.detail}</small>
            </span>
          </button>
        ))}
        <button
          type="button"
          className={styles.search}
          onClick={onSearch}
          aria-label="Search commands, boxes, regions, routes, and options"
          title="Global search"
        >
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
