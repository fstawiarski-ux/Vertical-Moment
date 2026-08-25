"use client";

import type { BoxState, ExploreContentBox, ExploreContentRegistry, JourneyStation, ViewportMode } from "../../core/types";
import { JOURNEY_STATIONS } from "../../core/journey";
import { stationPresentationsFor, type ResolvedWorkspaceManifest } from "../../core/workspaceManifest";
import { OfficialMark } from "../../brand/OfficialMark";
import styles from "./WorkspaceTopRail.module.css";

const STAGE_META: Record<JourneyStation, { detail: string; icon: string }> = {
  region: { detail: "Atlas", icon: "⌖" },
  rock: { detail: "Panorama", icon: "◔" },
  sector: { detail: "Routes", icon: "⌁" },
  topo: { detail: "Route detail", icon: "M" },
};

export function WorkspaceTopRail({
  registry,
  workspace,
  boxes,
  activeBoxId,
  stationContent,
  journeyStation,
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
  journeyStation: JourneyStation;
  viewportMode: ViewportMode;
  onOpenBox: (id: string) => void;
  onSearch: () => void;
  onContribute: () => void;
  onToggleJourney: () => void;
  followJourney: boolean;
}) {
  void workspace;
  void boxes;
  void onContribute;

  void stationContent;
  const presentations = stationPresentationsFor(registry);
  const station = journeyStation ?? JOURNEY_STATIONS.find((candidate) => presentations[candidate].focusBoxId === activeBoxId) ?? "region";
  const stationIndex = JOURNEY_STATIONS.indexOf(station);

  return (
    <header className={styles.chrome} data-viewport={viewportMode}>
      <nav className={styles.rail} aria-label="Desktop Explore journey">
        <span className={styles.identity} aria-hidden="true">
          <OfficialMark variant="utility-vm" mode="dark" size={27} decorative priority />
        </span>
        {JOURNEY_STATIONS.map((candidate, index) => (
          <button
            key={candidate}
            type="button"
            className={styles.stage}
            data-current={candidate === station ? "true" : "false"}
            data-passed={index < stationIndex ? "true" : "false"}
            aria-current={candidate === station ? "page" : undefined}
            onClick={() => onOpenBox(presentations[candidate].focusBoxId)}
            title={`Open ${STAGE_META[candidate].detail} without replaying the journey`}
          >
            <span className={styles.icon} aria-hidden="true">{STAGE_META[candidate].icon}</span>
            <span className={styles.copy}>
              <strong>{presentations[candidate].label}</strong>
              <small>{STAGE_META[candidate].detail}</small>
            </span>
          </button>
        ))}
        <button
          type="button"
          className={styles.follow}
          aria-pressed={followJourney}
          onClick={onToggleJourney}
          title={followJourney ? "Stop opening cards as the scrub changes stations" : "Let the scrub open the mapped card at each station"}
        >
          <span className={styles.followIcon} aria-hidden="true">↻</span>
          <span className={styles.copy}>
            <strong>{followJourney ? "Following" : "Follow"}</strong>
            <small>{followJourney ? "Cards on" : "Cards off"}</small>
          </span>
        </button>
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
