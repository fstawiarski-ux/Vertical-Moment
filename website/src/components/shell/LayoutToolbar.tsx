"use client";

import { useEffect, useState } from "react";
import { useLayoutState } from "../../core/layoutState";
import type { LayoutMode, ViewportMode } from "../../core/types";
import { OfflinePackButton } from "../../pwa/OfflinePackButton";
import styles from "./LayoutToolbar.module.css";

const modes: Array<{ id: LayoutMode; label: string }> = [
  { id: "explore", label: "Explore" },
  { id: "grid", label: "Grid" },
  { id: "presentation", label: "Present" },
];

export function LayoutToolbar({ viewportMode, offlinePack, onSearch, onReplayIntro }: {
  viewportMode: ViewportMode;
  offlinePack: string[];
  onSearch: () => void;
  onReplayIntro: () => void;
}) {
  const layoutMode = useLayoutState((state) => state.layoutMode);
  const canUndo = useLayoutState((state) => state.canUndo);
  const canRedo = useLayoutState((state) => state.canRedo);
  const dispatch = useLayoutState((state) => state.dispatch);
  const undo = useLayoutState((state) => state.undo);
  const redo = useLayoutState((state) => state.redo);
  const reset = useLayoutState((state) => state.reset);
  const [collapsed, setCollapsed] = useState(false);
  // Resolved after mount so the server-rendered markup stays platform neutral.
  const [shortcut, setShortcut] = useState("Ctrl K");

  const collapsible = viewportMode !== "desktop";

  useEffect(() => {
    if (/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)) setShortcut("⌘K");
  }, []);

  // A phone gives the rail no room to sit open over the cards, so it starts
  // collapsed there and stays open everywhere else.
  useEffect(() => setCollapsed(viewportMode === "mobile"), [viewportMode]);

  const autoLayout = () => dispatch({
    type: "APPLY_AUTO_LAYOUT",
    viewport: { width: window.innerWidth, height: window.innerHeight },
  });

  return (
    <nav
      className={styles.toolbar}
      data-collapsed={collapsed ? "true" : "false"}
      aria-label="Explore App layout controls"
    >
      {collapsible && (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Show workspace controls" : "Hide workspace controls"}
          onClick={() => setCollapsed((current) => !current)}
        >
          {collapsed ? "☰" : "×"}
        </button>
      )}

      {!collapsed && (
        <>
          <button type="button" className={styles.search} onClick={onSearch}>
            Search
            <kbd>{shortcut}</kbd>
          </button>
          <span className={styles.divider} />

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

          <div className={styles.history}>
            <button type="button" onClick={undo} disabled={!canUndo} aria-label="Undo layout change" title="Undo">↶</button>
            <button type="button" onClick={redo} disabled={!canRedo} aria-label="Redo layout change" title="Redo">↷</button>
          </div>
          <button type="button" onClick={reset}>Reset layout</button>
          <span className={styles.divider} />

          <button type="button" onClick={onReplayIntro}>Replay journey</button>
          <OfflinePackButton urls={offlinePack} />
          <span className={styles.viewport}>{viewportMode}</span>
        </>
      )}
    </nav>
  );
}
