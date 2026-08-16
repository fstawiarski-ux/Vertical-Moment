"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLayoutState } from "../../core/layoutState";
import type { LayoutMode, ScrubStationEventDetail, ViewportMode } from "../../core/types";
import { OfflinePackButton } from "../../pwa/OfflinePackButton";
import styles from "./LayoutToolbar.module.css";

const modes: Array<{ id: LayoutMode; label: string }> = [
  { id: "explore", label: "Explore" },
  { id: "grid", label: "Grid" },
  { id: "presentation", label: "Present" },
];

const MODULES = [
  { id: "crag-locator", label: "Atlas", short: "A" },
  { id: "nasenwand-spatial", label: "Routes", short: "R" },
  { id: "wachau-16", label: "360", short: "360" },
  { id: "nasenwand-model", label: "3D", short: "3D" },
  { id: "wall-reveal", label: "Wall", short: "W" },
] as const;

const REVIEWED_TOPO_IDS = ["nasenwand-model", "wachau-16", "crag-locator", "nasenwand-spatial"] as const;

type HudPanel = "tools" | "journey";
type IconName = "align" | "close" | "contribute" | "download" | "field" | "grid" | "layout" | "lock" | "minus" | "play" | "redo" | "replay" | "search" | "sliders" | "undo";

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
    case "field":
      return <svg {...common}><path d="M4 7h16v12H4z" /><path d="M8 7V5h8v2M8 12h8M12 9v6" /></svg>;
    case "grid":
      return <svg {...common}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
    case "layout":
      return <svg {...common}><rect x="4" y="4" width="6" height="16" rx="1" /><rect x="14" y="4" width="6" height="7" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
    case "lock":
      return <svg {...common}><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
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
    return <a className={styles.hudButton} href={href} title={title} aria-label={title}>{content}</a>;
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
      <div className={styles.panelGroups}>{children}</div>
    </section>
  );
}

function ActionGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.actionGroup} role="group" aria-label={label}>
      <span className={styles.groupLabel}>{label}</span>
      <div className={styles.actionGrid}>{children}</div>
    </div>
  );
}

function reviewedTopoFrames(width: number, height: number) {
  const safe = { top: 68, right: 96, bottom: 48, left: 8 };
  const usableWidth = Math.max(760, width - safe.left - safe.right);
  const usableHeight = Math.max(480, height - safe.top - safe.bottom);
  const edge = 8;
  const gap = 10;
  const modelWidth = Math.round(Math.max(230, Math.min(280, usableWidth * 0.18)));
  const topHeight = Math.round(Math.max(130, Math.min(178, usableHeight * 0.235)));
  const lowerY = safe.top + topHeight + 18;
  const lowerHeight = Math.max(230, height - safe.bottom - lowerY - edge);
  const atlasWidth = Math.round(Math.max(330, Math.min(430, usableWidth * 0.29)));
  const routesWidth = Math.round(Math.max(320, Math.min(410, usableWidth * 0.275)));
  const rightEdge = width - safe.right;
  const modelX = safe.left + edge;
  const panoramaX = modelX + modelWidth + gap;

  return {
    "nasenwand-model": { x: modelX, y: safe.top + edge, width: modelWidth, height: topHeight },
    "wachau-16": {
      x: panoramaX,
      y: safe.top + edge,
      width: Math.max(360, rightEdge - panoramaX - edge),
      height: topHeight,
    },
    "crag-locator": { x: safe.left + edge, y: lowerY, width: atlasWidth, height: lowerHeight },
    "nasenwand-spatial": {
      x: Math.max(safe.left + edge, rightEdge - routesWidth - edge),
      y: lowerY,
      width: routesWidth,
      height: lowerHeight,
    },
  } as const;
}

export function LayoutToolbar({ viewportMode, offlinePack, onSearch, onReplayIntro, followJourney, onToggleFollowJourney, unifiedChrome = false }: {
  viewportMode: ViewportMode;
  offlinePack: string[];
  onSearch: () => void;
  onReplayIntro: () => void;
  followJourney: boolean;
  onToggleFollowJourney: () => void;
  unifiedChrome?: boolean;
}) {
  const layoutMode = useLayoutState((state) => state.layoutMode);
  const boxes = useLayoutState((state) => state.boxes);
  const activeBoxId = useLayoutState((state) => state.activeBoxId);
  const canUndo = useLayoutState((state) => state.canUndo);
  const canRedo = useLayoutState((state) => state.canRedo);
  const dispatch = useLayoutState((state) => state.dispatch);
  const undo = useLayoutState((state) => state.undo);
  const redo = useLayoutState((state) => state.redo);
  const reset = useLayoutState((state) => state.reset);
  const [openPanel, setOpenPanel] = useState<HudPanel | null>(null);
  const [shortcut, setShortcut] = useState("Ctrl K");
  const [layoutLocked, setLayoutLocked] = useState(false);
  const [fieldOpsAvailable, setFieldOpsAvailable] = useState(false);
  const reviewedTopoApplied = useRef(false);

  useEffect(() => {
    if (/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)) setShortcut("⌘K");
  }, []);

  useEffect(() => {
    const syncFieldOps = () => {
      try {
        setFieldOpsAvailable(window.localStorage.getItem("vm-field-ops-authorized") === "1");
      } catch {
        setFieldOpsAvailable(false);
      }
    };
    syncFieldOps();
    window.addEventListener("storage", syncFieldOps);
    window.addEventListener("vm:field-ops-auth", syncFieldOps);
    return () => {
      window.removeEventListener("storage", syncFieldOps);
      window.removeEventListener("vm:field-ops-auth", syncFieldOps);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.vmLayoutLocked = layoutLocked ? "true" : "false";
    return () => { delete document.documentElement.dataset.vmLayoutLocked; };
  }, [layoutLocked]);

  useEffect(() => {
    if (activeBoxId) document.documentElement.dataset.vmActiveBox = activeBoxId;
    else delete document.documentElement.dataset.vmActiveBox;
    return () => { delete document.documentElement.dataset.vmActiveBox; };
  }, [activeBoxId]);

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

  const setLock = useCallback((locked: boolean) => {
    setLayoutLocked(locked);
    document.documentElement.dataset.vmLayoutLocked = locked ? "true" : "false";
  }, []);

  const applyReviewedTopoLayout = useCallback(() => {
    if (viewportMode !== "desktop" || !unifiedChrome) return;
    const frames = reviewedTopoFrames(window.innerWidth, window.innerHeight);
    dispatch({ type: "SET_LAYOUT_MODE", mode: "explore" });
    for (const id of REVIEWED_TOPO_IDS) {
      dispatch({ type: "SET_BOX_MODE", id, mode: "normal" });
      dispatch({ type: "UPDATE_BOX", id, patch: frames[id] });
    }
    dispatch({ type: "SET_BOX_MODE", id: "wall-reveal", mode: "minimized" });
    dispatch({ type: "SET_ACTIVE_BOX", id: "nasenwand-model" });
    if (followJourney) onToggleFollowJourney();
    setLock(true);
    reviewedTopoApplied.current = true;
  }, [dispatch, followJourney, onToggleFollowJourney, setLock, unifiedChrome, viewportMode]);

  useEffect(() => {
    const onStation = (event: Event) => {
      const detail = (event as CustomEvent<ScrubStationEventDetail>).detail;
      if (!detail?.station) return;
      if (detail.station !== "topo") {
        reviewedTopoApplied.current = false;
        setLock(false);
        return;
      }
      if (detail.phase === "arrived" && viewportMode === "desktop" && unifiedChrome) {
        window.requestAnimationFrame(() => applyReviewedTopoLayout());
      }
    };
    window.addEventListener("vm:scrub-station", onStation);
    return () => window.removeEventListener("vm:scrub-station", onStation);
  }, [applyReviewedTopoLayout, setLock, unifiedChrome, viewportMode]);

  /* Static/reduced-motion arrivals emit their Topo event before this toolbar is
     mounted. Detect the canonical one-box Topo handoff once and promote it to
     the reviewed four-box arrival composition. */
  useEffect(() => {
    if (viewportMode !== "desktop" || !unifiedChrome || !followJourney || reviewedTopoApplied.current) return;
    const visible = boxes.filter((box) => box.mode !== "minimized");
    if (visible.length !== 1 || visible[0]?.id !== "nasenwand-model") return;
    const timer = window.setTimeout(() => applyReviewedTopoLayout(), 180);
    return () => window.clearTimeout(timer);
  }, [applyReviewedTopoLayout, boxes, followJourney, unifiedChrome, viewportMode]);

  const closeAfter = (run: () => void) => {
    run();
    setOpenPanel(null);
  };

  const autoLayout = () => closeAfter(() => dispatch({
    type: "APPLY_AUTO_LAYOUT",
    viewport: { width: window.innerWidth, height: window.innerHeight },
  }));

  const setMode = (mode: LayoutMode) => closeAfter(() => {
    setLock(false);
    dispatch({ type: "SET_LAYOUT_MODE", mode });
  });

  const openModule = (id: string) => {
    setLock(false);
    window.dispatchEvent(new CustomEvent("vm:focus-box", { detail: { id, mode: "normal" } }));
  };

  const toggleLock = () => setLock(!layoutLocked);

  if (viewportMode === "mobile") return null;

  return (
    <nav className={styles.toolbar} data-viewport={viewportMode} data-unified={unifiedChrome ? "true" : "false"} aria-label="Explore workspace controls">
      <div className={styles.rail} aria-label="Persistent workspace rail">
        <button type="button" className={styles.railButton} data-active={layoutLocked ? "true" : "false"} onClick={toggleLock} title={layoutLocked ? "Unlock layout" : "Lock layout"} aria-pressed={layoutLocked}>
          <Icon name="lock" /><span>{layoutLocked ? "Locked" : "Lock"}</span>
        </button>
        <button type="button" className={styles.railButton} data-active={layoutMode === "explore" ? "true" : "false"} onClick={() => setMode("explore")} title="Explore layout"><Icon name="layout" /><span>Explore</span></button>
        <button type="button" className={styles.railButton} data-active={layoutMode === "grid" ? "true" : "false"} onClick={() => setMode("grid")} title="Grid layout"><Icon name="grid" /><span>Grid</span></button>
        <button type="button" className={styles.railButton} data-active={layoutMode === "presentation" ? "true" : "false"} onClick={() => setMode("presentation")} title="Presentation layout"><Icon name="play" /><span>Present</span></button>
        <button type="button" className={styles.railButton} onClick={() => { setLock(false); autoLayout(); }} title="Auto-align workspace"><Icon name="align" /><span>Align</span></button>

        <span className={styles.divider} aria-hidden="true" />
        <span className={styles.railLabel}>Modules</span>
        {MODULES.map((module) => {
          const box = boxes.find((candidate) => candidate.id === module.id);
          const open = Boolean(box && box.mode !== "minimized");
          const active = activeBoxId === module.id;
          return (
            <button
              key={module.id}
              type="button"
              className={styles.moduleButton}
              data-open={open ? "true" : "false"}
              data-active={active ? "true" : "false"}
              onClick={() => openModule(module.id)}
              title={`${open ? "Focus" : "Open"} ${module.label}`}
              aria-label={`${open ? "Focus" : "Open"} ${module.label} module`}
              aria-pressed={active}
            >
              <strong>{module.short}</strong><span>{module.label}</span>
            </button>
          );
        })}

        <span className={styles.divider} aria-hidden="true" />
        <button
          type="button"
          className={styles.railButton}
          data-active={openPanel === "tools" ? "true" : "false"}
          aria-expanded={openPanel === "tools"}
          aria-controls="explore-tools-panel"
          onClick={() => setOpenPanel((current) => current === "tools" ? null : "tools")}
          title="More tools"
        >
          <Icon name="sliders" /><span>Tools</span>
        </button>
        <button type="button" className={styles.railButton} onClick={undo} disabled={!canUndo} title="Undo layout change"><Icon name="undo" /><span>Undo</span></button>
        <button type="button" className={styles.railButton} onClick={redo} disabled={!canRedo} title="Redo layout change"><Icon name="redo" /><span>Redo</span></button>
      </div>

      {openPanel === "tools" && (
        <Panel id="explore-tools-panel" title="Tools" onClose={() => setOpenPanel(null)}>
          <ActionGroup label="View">
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
          </ActionGroup>
          <ActionGroup label="Arrange">
            <HudButton icon="lock" label={layoutLocked ? "Unlock" : "Lock"} title={layoutLocked ? "Unlock freeform layout" : "Lock freeform layout"} pressed={layoutLocked} onClick={toggleLock} />
            <HudButton icon="align" label="Align" title="Auto-align workspace" onClick={() => { setLock(false); autoLayout(); }} />
            <HudButton icon="minus" label="Collapse all" title="Minimize all boxes" onClick={() => closeAfter(() => dispatch({ type: "MINIMIZE_ALL" }))} />
            <HudButton icon="undo" label="Undo" title="Undo layout change" onClick={() => closeAfter(undo)} disabled={!canUndo} />
            <HudButton icon="redo" label="Redo" title="Redo layout change" onClick={() => closeAfter(redo)} disabled={!canRedo} />
            <HudButton icon="replay" label="Reset" title="Reset layout" onClick={() => closeAfter(() => { setLock(false); reset(); })} />
          </ActionGroup>
          {unifiedChrome && (
            <>
              <ActionGroup label="Journey">
                <HudButton
                  icon="replay"
                  label={followJourney ? "Following" : "Follow"}
                  title={followJourney ? "Journey is controlling the current station" : "Follow Region, Rock, Sector and Topo recommendations"}
                  pressed={followJourney}
                  onClick={onToggleFollowJourney}
                />
                <HudButton icon="replay" label="Replay" title="Replay approach journey" onClick={() => closeAfter(onReplayIntro)} />
                <HudButton icon="contribute" label="Create" title="Open contributor field beta" href="/contribute?source=explore-app" />
                {fieldOpsAvailable && <HudButton icon="field" label="Field Ops" title="Open private Field Ops" href="/explore-app/field" />}
              </ActionGroup>
              <ActionGroup label="Offline">
                <div className={styles.offlineButton} title="Save route data and selected media for offline use">
                  <OfflinePackButton urls={offlinePack} />
                </div>
              </ActionGroup>
            </>
          )}
        </Panel>
      )}
    </nav>
  );
}
