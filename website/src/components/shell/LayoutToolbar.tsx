"use client";

import { useLayoutState } from "../../core/layoutState";
import type { LayoutMode, ViewportMode } from "../../core/types";
import { OfflinePackButton } from "../../pwa/OfflinePackButton";
import styles from "./LayoutToolbar.module.css";

const modes: Array<{ id: LayoutMode; label: string }> = [
  { id: "explore", label: "Explore" },
  { id: "grid", label: "Grid" },
  { id: "presentation", label: "Present" },
];

export function LayoutToolbar({ viewportMode, offlinePack }: { viewportMode: ViewportMode; offlinePack: string[] }) {
  const layoutMode = useLayoutState((state) => state.layoutMode);
  const activeBoxId = useLayoutState((state) => state.activeBoxId);
  const heroBoxId = useLayoutState((state) => state.heroBoxId);
  const dispatch = useLayoutState((state) => state.dispatch);

  const autoLayout = () => dispatch({
    type: "APPLY_AUTO_LAYOUT",
    viewport: { width: window.innerWidth, height: window.innerHeight },
  });

  return (
    <nav className={styles.toolbar} aria-label="Explore App layout controls">
      <div className={styles.modes} aria-label="Layout mode">
        {modes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            aria-pressed={layoutMode === mode.id}
            onClick={() => dispatch({ type: "SET_LAYOUT_MODE", mode: mode.id })}
          >
            {mode.label}
          </button>
        ))}
      </div>
      <span className={styles.divider} />
      <button type="button" onClick={autoLayout}>Auto-align</button>
      <button type="button" onClick={() => dispatch({ type: "MINIMIZE_ALL" })}>Minimize all</button>
      <OfflinePackButton urls={offlinePack} />
      <button
        type="button"
        disabled={!activeBoxId}
        onClick={() => dispatch({ type: "SET_HERO_BOX", id: activeBoxId })}
      >
        Make hero
      </button>
      <button
        type="button"
        disabled={!heroBoxId}
        onClick={() => dispatch({ type: "SET_HERO_BOX", id: null })}
      >
        Default hero
      </button>
      <span className={styles.viewport}>{viewportMode}</span>
    </nav>
  );
}
