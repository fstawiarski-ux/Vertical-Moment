"use client";

import type { ExploreContentBox } from "../../core/types";
import styles from "./ContextBreadcrumb.module.css";

/**
 * Region → Crag → Sector, always visible so the workspace never loses its
 * place. Each level opens the palette filtered to that level, which is how a
 * visitor moves sideways from one crag to its neighbours.
 */
export function ContextBreadcrumb({ box, onNavigate }: {
  box: ExploreContentBox | null;
  onNavigate: (term: string) => void;
}) {
  // Some places are their own region — the Wachau panoramas, the belt-wide
  // atlas — so a repeated level is collapsed rather than shown twice.
  const levels = box
    ? [box.region, box.crag, box.sector ? `${box.sector} Sector` : null]
        .filter((level): level is string => Boolean(level))
        .filter((level, index, all) => level !== all[index - 1])
    : [];

  return (
    <nav className={styles.breadcrumb} aria-label="Current location">
      {levels.length === 0 ? (
        <button type="button" className={styles.resting} onClick={() => onNavigate("")}>
          Search the Lounge
        </button>
      ) : levels.map((level, index) => (
        <span key={level} className={styles.level}>
          {index > 0 && <i aria-hidden="true">›</i>}
          <button
            type="button"
            // The last level is where you already are, so it reads as current
            // rather than as somewhere else to go.
            aria-current={index === levels.length - 1 ? "location" : undefined}
            onClick={() => onNavigate(level.replace(/ Sector$/, ""))}
          >
            {level}
          </button>
        </span>
      ))}
    </nav>
  );
}
