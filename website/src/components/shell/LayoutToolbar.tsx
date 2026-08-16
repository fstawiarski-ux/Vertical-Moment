"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLayoutState } from "../../core/layoutState";
import type { LayoutMode, ViewportMode } from "../../core/types";
import { OfflinePackButton } from "../../pwa/OfflinePackButton";
import styles from "./LayoutToolbar.module.css";

const MODULES = [
  { id: "crag-locator", label: "Atlas", short: "A" },
  { id: "nasenwand-spatial", label: "Routes", short: "R" },
  { id: "wachau-16", label: "360", short: "360" },
  { id: "nasenwand-model", label: "3D", short: "3D" },
  { id: "wall-reveal", label: "Wall", short: "W" },
] as const;

type IconName = "align" | "close" | "contribute" | "field" | "grid" | "layout" | "lock" | "minus" | "play" | "redo" | "replay" | "search" | "sliders" | "undo";

function Icon({ name }: { name: IconName }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "align": return <svg {...common}><path d="M6 4v16M18 4v16M3 8h6M15 8h6M3 16h6M15 16h6" /></svg>;
    case "close": return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "contribute": return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v8M8 12h8" /></svg>;
    case "field": return <svg {...common}><path d="M4 7h16v12H4z" /><path d="M8 7V5h8v2M8 12h8M12 9v6" /></svg>;
    case "grid": return <svg {...common}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
    case "layout": return <svg {...common}><rect x="4" y="4" width="6" height="16" rx="1" /><rect x="14" y="4" width="6" height="7" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
    case "lock": return <svg {...common}><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
    case "minus": return <svg {...common}><path d="M5 12h14" /></svg>;
    case "play": return <svg {...common}><path d="m10 8 6 4-6 4V8Z" /></svg>;
    case "redo": return <svg {...common}><path d="m15 7 5 5-5 5M19 12h-8a5 5 0 0 0-5 5" /></svg>;
    case "replay": return <svg {...common}><path d="M19 12a7 7 0 1 1-2-4.9" /><path d="M19 5v5h-5" /></svg>;
    case "search": return <svg {...common}><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4.5 4.5" /></svg>;
    case "sliders": return <svg {...common}><path d="M4 7h16M4 17h16M8 4v6M16 14v6" /><circle cx="8" cy="7" r="2" /><circle cx="16" cy="17" r="2" /></svg>;
    case "undo": return <svg {...common}><path d="m9 7-5 5 5 5M5 12h8a5 5 0 0 1 5 5" /></svg>;
  }
}

function HudButton({ icon, label, title, onClick, disabled = false, href }: { icon: IconName; label: string; title: string; onClick?: () => void; disabled?: boolean; href?: string }) {
  const content = <><Icon name={icon} /><span>{label}</span></>;
  if (href) return <a className={styles.hudButton} href={href} title={title} aria-label={title}>{content}</a>;
  return <button type="button" className={styles.hudButton} title={title} aria-label={title} onClick={onClick} disabled={disabled}>{content}</button>;
}

function Panel({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <section id="explore-tools-panel" className={styles.panel} aria-label={`${title} controls`}>
      <header className={styles.panelHeader}><span>{title}</span><button type="button" className={styles.close} onClick={onClose} aria-label={`Close ${title} controls`}><Icon name="close" /></button></header>
      <div className={styles.panelGroups}>{children}</div>
    </section>
  );
}

function ActionGroup({ label, children }: { label: string; children: ReactNode }) {
  return <div className={styles.actionGroup} role="group" aria-label={label}><span className={styles.groupLabel}>{label}</span><div className={styles.actionGrid}>{children}</div></div>;
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
  const [openPanel, setOpenPanel] = useState(false);
  const [layoutLocked, setLayoutLocked] = useState(false);
  const [fieldOpsAvailable, setFieldOpsAvailable] = useState(false);
  void followJourney;
  void onToggleFollowJourney;

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
    const syncFieldOps = () => {
      try { setFieldOpsAvailable(window.localStorage.getItem("vm-field-ops-authorized") === "1"); }
      catch { setFieldOpsAvailable(false); }
    };
    syncFieldOps();
    window.addEventListener("storage", syncFieldOps);
    window.addEventListener("vm:field-ops-auth", syncFieldOps);
    return () => { window.removeEventListener("storage", syncFieldOps); window.removeEventListener("vm:field-ops-auth", syncFieldOps); };
  }, []);

  useEffect(() => {
    if (!openPanel) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpenPanel(false); };
    const onPointerDown = (event: PointerEvent) => { if (!(event.target as Element | null)?.closest(`.${styles.toolbar}`)) setOpenPanel(false); };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => { window.removeEventListener("keydown", onKeyDown); document.removeEventListener("pointerdown", onPointerDown); };
  }, [openPanel]);

  const openModule = (id: string) => {
    // Opening/focusing a module must never change the user's lock state and
    // never re-enable journey-following.
    window.dispatchEvent(new CustomEvent("vm:focus-box", { detail: { id, mode: "normal" } }));
  };
  const setMode = (mode: LayoutMode) => dispatch({ type: "SET_LAYOUT_MODE", mode });
  const autoLayout = () => dispatch({ type: "APPLY_AUTO_LAYOUT", viewport: { width: window.innerWidth, height: window.innerHeight } });

  if (viewportMode === "mobile") return null;

  return (
    <nav className={styles.toolbar} data-viewport={viewportMode} data-unified={unifiedChrome ? "true" : "false"} aria-label="Explore workspace controls">
      <div className={styles.rail} aria-label="Persistent workspace rail">
        <button type="button" className={styles.railButton} data-active={layoutLocked ? "true" : "false"} onClick={() => setLayoutLocked((value) => !value)} title={layoutLocked ? "Unlock layout" : "Lock layout"} aria-pressed={layoutLocked}><Icon name="lock" /><span>{layoutLocked ? "Locked" : "Lock"}</span></button>
        <button type="button" className={styles.railButton} data-active={layoutMode === "explore" ? "true" : "false"} onClick={() => setMode("explore")} title="Explore layout"><Icon name="layout" /><span>Explore</span></button>
        <button type="button" className={styles.railButton} data-active={layoutMode === "grid" ? "true" : "false"} onClick={() => setMode("grid")} title="Grid layout"><Icon name="grid" /><span>Grid</span></button>
        <button type="button" className={styles.railButton} data-active={layoutMode === "presentation" ? "true" : "false"} onClick={() => setMode("presentation")} title="Presentation layout"><Icon name="play" /><span>Present</span></button>
        <button type="button" className={styles.railButton} onClick={autoLayout} title="Auto-align workspace"><Icon name="align" /><span>Align</span></button>

        <span className={styles.divider} aria-hidden="true" />
        <span className={styles.railLabel}>Modules</span>
        {MODULES.map((module) => {
          const box = boxes.find((candidate) => candidate.id === module.id);
          const open = Boolean(box && box.mode !== "minimized");
          const active = activeBoxId === module.id;
          return (
            <button key={module.id} type="button" className={styles.moduleButton} data-open={open ? "true" : "false"} data-active={active ? "true" : "false"} onClick={() => openModule(module.id)} title={`${open ? "Focus" : "Open"} ${module.label}`} aria-label={`${open ? "Focus" : "Open"} ${module.label} module`} aria-pressed={active}>
              <strong>{module.short}</strong><span>{module.label}</span>
            </button>
          );
        })}

        <span className={styles.divider} aria-hidden="true" />
        <button type="button" className={styles.railButton} data-active={openPanel ? "true" : "false"} aria-expanded={openPanel} aria-controls="explore-tools-panel" onClick={() => setOpenPanel((value) => !value)} title="More tools"><Icon name="sliders" /><span>Tools</span></button>
        <button type="button" className={styles.railButton} onClick={undo} disabled={!canUndo} title="Undo layout change"><Icon name="undo" /><span>Undo</span></button>
        <button type="button" className={styles.railButton} onClick={redo} disabled={!canRedo} title="Redo layout change"><Icon name="redo" /><span>Redo</span></button>
      </div>

      {openPanel && (
        <Panel title="Tools" onClose={() => setOpenPanel(false)}>
          <ActionGroup label="Workspace">
            <HudButton icon="search" label="Search" title="Search the Lounge" onClick={() => { setOpenPanel(false); onSearch(); }} />
            <HudButton icon="minus" label="Collapse" title="Minimize all modules" onClick={() => { setOpenPanel(false); dispatch({ type: "MINIMIZE_ALL" }); }} />
            <HudButton icon="replay" label="Reset" title="Reset saved layout" onClick={() => { setOpenPanel(false); reset(); }} />
          </ActionGroup>
          {unifiedChrome && (
            <ActionGroup label="Journey & field">
              <HudButton icon="replay" label="Replay" title="Replay the one-time Region to Topo journey" onClick={() => { setOpenPanel(false); onReplayIntro(); }} />
              <HudButton icon="contribute" label="Create" title="Open contributor field beta" href="/contribute?source=explore-app" />
              {fieldOpsAvailable && <HudButton icon="field" label="Field Ops" title="Open private Field Ops" href="/explore-app/field" />}
            </ActionGroup>
          )}
          {unifiedChrome && (
            <ActionGroup label="Offline">
              <div className={styles.offlineButton} title="Save route data and selected media for offline use"><OfflinePackButton urls={offlinePack} /></div>
            </ActionGroup>
          )}
        </Panel>
      )}
    </nav>
  );
}
