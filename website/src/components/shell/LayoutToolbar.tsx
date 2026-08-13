"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLayoutState } from "../../core/layoutState";
import type { LayoutMode, ViewportMode } from "../../core/types";
import { OfflinePackButton } from "../../pwa/OfflinePackButton";
import styles from "./LayoutToolbar.module.css";

const modes: Array<{ id: LayoutMode; label: string }> = [
  { id: "explore", label: "Explore" },
  { id: "grid", label: "Grid" },
  { id: "presentation", label: "Present" },
];

type HudPanel = "tools" | "journey";
type IconName = "align" | "close" | "contribute" | "download" | "grid" | "layout" | "minus" | "play" | "redo" | "replay" | "search" | "sliders" | "undo";

function Icon({ name }: { name: IconName }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "align":
      return <svg {...common}><path d="M6 4v16M18 4v16M3 8h6M15 8h6M3 16h6M15 16h6" /></svg>;
    case "close":
      return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "contribute":
      return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v8M8 12h8" /></svg>;
    case "download":
      return <svg {...common}><path d="M12 4v10M8 10l4 4 4-4M5 19h14" /></svg>;
    case "grid":
      return <svg {...common}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
    case "layout":
      return <svg {...common}><rect x="4" y="4" width="6" height="16" rx="1" /><rect x="14" y="4" width="6" height="7" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
    case "minus":
      return <svg {...common}><path d="M5 12h14" /></svg>;
    case "play":
      return <svg {...common}><path d="m10 8 6 4-6 4V8Z" /></svg>;
    case "redo":
      return <svg {...common}><path d="m15 7 5 5-5 5M19 12h-8a5 5 0 0 0-5 5" /></svg>;
    case "replay":
      return <svg {...common}><path d="M19 12a7 7 0 1 1-2-4.9" /><path d="M19 5v5h-5" /><path d="m10 9 4 3-4 3V9Z" /></svg>;
    case "search":
      return <svg {...common}><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4.5 4.5" /></svg>;
    case "sliders":
      return <svg {...common}><path d="M4 7h16M4 17h16M8 4v6M16 14v6" /><circle cx="8" cy="7" r="2" /><circle cx="16" cy="17" r="2" /></svg>;
    case "undo":
      return <svg {...common}><path d="m9 7-5 5 5 5M5 12h8a5 5 0 0 1 5 5" /></svg>;
  }
}

function HudButton({ icon, label, title, onClick, disabled = false, pressed, href }: {
  icon: IconName;
  label: string;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  pressed?: boolean;
  href?: string;
}) {
  const content = <><Icon name={icon} /><span>{label}</span></>;

  if (href) {
    return (
      <a
        className={styles.hudButton}
        href={href}
        target="_blank"
        rel="noreferrer"
        title={title}
        aria-label={title}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={styles.hudButton}
      title={title}
      aria-label={title}
      aria-pressed={pressed}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );
}

function Panel({ id, title, children, onClose }: { id: string; title: string; children: ReactNode; onClose: () => void }) {
  return (
    <section id={id} className={styles.panel} aria-label={`${title} controls`}>
      <header className={styles.panelHeader}>
        <span>{title}</span>
        <button type="button" className={styles.close} onClick={onClose} aria-label={`Close ${title} controls`} title="Close">
          <Icon name="close" />
        </button>
      </header>
      <div className={styles.actionGrid}>{children}</div>
    </section>
  );
}

export function LayoutToolbar({ viewportMode, offlinePack, onSearch, onReplayIntro, followJourney, onToggleFollowJourney }: {
  viewportMode: ViewportMode;
  offlinePack: string[];
  onSearch: () => void;
  onReplayIntro: () => void;
  followJourney: boolean;
  onToggleFollowJourney: () => void;
}) {
  const layoutMode = useLayoutState((state) => state.layoutMode);
  const canUndo = useLayoutState((state) => state.canUndo);
  const canRedo = useLayoutState((state) => state.canRedo);
  const dispatch = useLayoutState((state) => state.dispatch);
  const undo = useLayoutState((state) => state.undo);
  const redo = useLayoutState((state) => state.redo);
  const reset = useLayoutState((state) => state.reset);
  const [openPanel, setOpenPanel] = useState<HudPanel | null>(null);
  const [shortcut, setShortcut] = useState("Ctrl K");

  useEffect(() => {
    if (/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)) setShortcut("⌘K");
  }, []);

  useEffect(() => {
    if (!openPanel) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPanel(null);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target as Element | null)?.closest(`.${styles.toolbar}`)) setOpenPanel(null);
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openPanel]);

  const closeAfter = (run: () => void) => {
    run();
    setOpenPanel(null);
  };

  const autoLayout = () => closeAfter(() => dispatch({
    type: "APPLY_AUTO_LAYOUT",
    viewport: { width: window.innerWidth, height: window.innerHeight },
  }));

  const setMode = (mode: LayoutMode) => closeAfter(() => dispatch({ type: "SET_LAYOUT_MODE", mode }));

  return (
    <nav className={styles.toolbar} data-viewport={viewportMode} aria-label="Explore workspace controls">
      <div className={styles.anchorStack}>
        <button
          type="button"
          className={styles.anchor}
          aria-expanded={openPanel === "tools"}
          aria-controls="explore-tools-panel"
          aria-label="Open workspace tools"
          title="Tools"
          onClick={() => setOpenPanel((current) => current === "tools" ? null : "tools")}
        >
          <Icon name="sliders" />
          <span>Tools</span>
        </button>
        <button
          type="button"
          className={styles.anchor}
          aria-expanded={openPanel === "journey"}
          aria-controls="explore-journey-panel"
          aria-label="Open journey controls"
          title="Journey"
          onClick={() => setOpenPanel((current) => current === "journey" ? null : "journey")}
        >
          <Icon name="replay" />
          <span>Journey</span>
        </button>
      </div>

      {openPanel === "tools" && (
        <Panel id="explore-tools-panel" title="Tools" onClose={() => setOpenPanel(null)}>
          <HudButton icon="search" label="Search" title={`Search the Lounge (${shortcut})`} onClick={() => closeAfter(onSearch)} />
          {modes.map((mode) => (
            <HudButton
              key={mode.id}
              icon={mode.id === "grid" ? "grid" : mode.id === "presentation" ? "play" : "layout"}
              label={mode.label}
              title={`Switch to ${mode.label} layout`}
              pressed={layoutMode === mode.id}
              onClick={() => setMode(mode.id)}
            />
          ))}
          <HudButton icon="align" label="Align" title="Auto-align workspace" onClick={autoLayout} />
          <HudButton icon="minus" label="Collapse" title="Minimize all boxes" onClick={() => closeAfter(() => dispatch({ type: "MINIMIZE_ALL" }))} />
          <HudButton icon="undo" label="Undo" title="Undo layout change" onClick={() => closeAfter(undo)} disabled={!canUndo} />
          <HudButton icon="redo" label="Redo" title="Redo layout change" onClick={() => closeAfter(redo)} disabled={!canRedo} />
          <HudButton icon="replay" label="Reset" title="Reset layout" onClick={() => closeAfter(reset)} />
        </Panel>
      )}

      {openPanel === "journey" && (
        <Panel id="explore-journey-panel" title="Journey" onClose={() => setOpenPanel(null)}>
          <HudButton
            icon="replay"
            label={followJourney ? "Following" : "Follow"}
            title={followJourney ? "Stop automatic station presentation" : "Follow Region, Rock, Sector and Topo with contextual boxes"}
            pressed={followJourney}
            onClick={onToggleFollowJourney}
          />
          <HudButton icon="replay" label="Replay" title="Replay approach journey" onClick={() => closeAfter(onReplayIntro)} />
          <HudButton icon="contribute" label="Add" title="Open contributor field beta" href="/contribute?source=explore-app" />
          <div className={styles.offlineButton} title="Save the Explore workspace offline">
            <OfflinePackButton urls={offlinePack} />
          </div>
        </Panel>
      )}
    </nav>
  );
}
