"use client";

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Box3DModel } from "./boxes/Box3DModel";
import { IntroScrubSequence } from "./animation/IntroScrubSequence";
import { OfficialMark } from "../brand/OfficialMark";
import { prefersReducedMotion } from "../core/introPreferences";
import type {
  ExploreContentBox,
  ExploreContentRegistry,
  IntroMode,
  JourneyStation,
  ScrubStationEventDetail,
} from "../core/types";
import styles from "./UnifiedExplorePreview.module.css";

const CragLocator = lazy(() => import("./boxes/BoxCragLocator"));
const NasenwandRoutes = lazy(() => import("./boxes/BoxNasenwandRoutes"));
const WachauPanorama = lazy(() => import("./boxes/BoxWachauPanorama"));
const WallReveal = lazy(() => import("./boxes/BoxWallReveal"));

const MODULES = [
  { id: "crag-locator", label: "Atlas", weight: "Core", hint: "The map and location spine" },
  { id: "wall-reveal", label: "Wall Reveal", weight: "Story", hint: "Place and topo narrative" },
  { id: "nasenwand-spatial", label: "Routes", weight: "Working", hint: "Sector facts and route context" },
  { id: "nasenwand-model", label: "3D Wall", weight: "Heavy", hint: "Load interactive geometry on intent" },
  { id: "wachau-16", label: "Panorama", weight: "Heavy", hint: "Wachau studies and 360 view" },
] as const;

type PreviewModuleId = (typeof MODULES)[number]["id"];

const STATIONS: ReadonlyArray<{
  id: JourneyStation;
  index: string;
  label: string;
  title: string;
  copy: string;
}> = [
  { id: "region", index: "01", label: "Region", title: "Start broad", copy: "Find a region and see the crags around it." },
  { id: "rock", index: "02", label: "Rock", title: "Bring the wall forward", copy: "Move from the approach into a real wall study." },
  { id: "sector", index: "03", label: "Sector", title: "Choose the working layer", copy: "Keep sector and route facts beside the wall." },
  { id: "topo", index: "04", label: "Topo", title: "Inspect with intent", copy: "Open the 3D model, panorama or provisional layer only when useful." },
];

const MODULE_FOR_STATION: Record<JourneyStation, PreviewModuleId> = {
  region: "crag-locator",
  rock: "wall-reveal",
  sector: "nasenwand-spatial",
  topo: "nasenwand-model",
};

const STATION_FOR_MODULE: Partial<Record<PreviewModuleId, JourneyStation>> = {
  "crag-locator": "region",
  "wall-reveal": "rock",
  "nasenwand-spatial": "sector",
  "nasenwand-model": "topo",
};

function contentFor(registry: ExploreContentRegistry, id: string) {
  return registry.boxes.find((content) => content.id === id) ?? null;
}

function moduleForBoxId(id: string): PreviewModuleId | null {
  return MODULES.some((module) => module.id === id) ? id as PreviewModuleId : null;
}

function IntroGuide({ firstMove }: { firstMove: boolean }) {
  return (
    <aside className={styles.introGuide} aria-label="Explore preview gestures">
      <small>Unified Explore preview</small>
      <strong>{firstMove ? "One move, four tools." : "One movement teaches the path."}</strong>
      {firstMove ? (
        <div className={styles.gestureChips}>
          <span><b>Swipe</b> fly between stations</span>
          <span><b>Tap</b> open one focused layer</span>
          <span><b>Drag</b> inspect the map</span>
          <span><b>3D</b> loads only on intent</span>
        </div>
      ) : (
        <p>Region → Rock → Sector → Topo. The same journey becomes the map, the wall and the tool rail.</p>
      )}
    </aside>
  );
}

function AtlasCue({ content }: { content: ExploreContentBox | null }) {
  return (
    <div className={styles.atlasCue}>
      <span className={styles.moduleKicker}>Core canvas</span>
      <h3>{content?.title ?? "Crag Locator"}</h3>
      <p>The map stays in the center. Search a region, choose a crag, then let the location spine carry the context forward.</p>
      <div className={styles.cueSteps}>
        <span><b>01</b> region</span>
        <span><b>02</b> crag</span>
        <span><b>03</b> route</span>
      </div>
      <small>All geometry and route rows remain sourced from the current atlas. No new lines are inferred here.</small>
    </div>
  );
}

function ModuleBody({ id, registry }: { id: PreviewModuleId; registry: ExploreContentRegistry }) {
  const content = contentFor(registry, id);

  if (id === "crag-locator") return <AtlasCue content={content} />;
  if (id === "nasenwand-model" && content?.model) {
    return <Box3DModel model={content.model} poster={content.image} isActive intentOnly />;
  }
  if (id === "wall-reveal") {
    return <Suspense fallback={<div className={styles.moduleLoading}>Preparing the wall story…</div>}><WallReveal /></Suspense>;
  }
  if (id === "nasenwand-spatial") {
    return <Suspense fallback={<div className={styles.moduleLoading}>Preparing the route layer…</div>}><NasenwandRoutes /></Suspense>;
  }
  if (id === "wachau-16") {
    return <Suspense fallback={<div className={styles.moduleLoading}>Preparing the panorama…</div>}><WachauPanorama /></Suspense>;
  }
  return <div className={styles.moduleLoading}>This layer is not present in the current registry.</div>;
}

export function UnifiedExplorePreview({ registry }: { registry: ExploreContentRegistry }) {
  const [introMode, setIntroMode] = useState<IntroMode | null>(null);
  const [workspaceUnlocked, setWorkspaceUnlocked] = useState(false);
  const [firstMove, setFirstMove] = useState(false);
  const [station, setStation] = useState<JourneyStation>("region");
  const [activeModule, setActiveModule] = useState<PreviewModuleId>("nasenwand-model");
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIntroMode(params.get("intro") === "skip" || prefersReducedMotion() ? "static" : "cinematic");
  }, []);

  useEffect(() => {
    const onStation = (event: Event) => {
      const detail = (event as CustomEvent<ScrubStationEventDetail>).detail;
      if (detail?.station) {
        setStation(detail.station);
        setActiveModule(MODULE_FOR_STATION[detail.station]);
      }
    };
    const onFocus = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      const id = detail?.id ? moduleForBoxId(detail.id) : null;
      if (id) {
        setActiveModule(id);
        const nextStation = STATION_FOR_MODULE[id];
        if (nextStation) setStation(nextStation);
      }
    };
    window.addEventListener("vm:scrub-station", onStation);
    window.addEventListener("vm:focus-box", onFocus);
    return () => {
      window.removeEventListener("vm:scrub-station", onStation);
      window.removeEventListener("vm:focus-box", onFocus);
    };
  }, []);

  const activeContent = useMemo(() => contentFor(registry, activeModule), [activeModule, registry]);
  const stationInfo = STATIONS.find((candidate) => candidate.id === station) ?? STATIONS[0];

  const chooseModule = useCallback((id: PreviewModuleId) => {
    setActiveModule(id);
    const nextStation = STATION_FOR_MODULE[id];
    if (nextStation) setStation(nextStation);
  }, []);

  const chooseStation = useCallback((next: JourneyStation) => {
    setStation(next);
    setActiveModule(MODULE_FOR_STATION[next]);
    window.dispatchEvent(new CustomEvent("vm:preview-station-request", { detail: { station: next } }));
  }, []);

  const unlock = useCallback(() => {
    setWorkspaceUnlocked(true);
    setStation("topo");
    setActiveModule("nasenwand-model");
  }, []);

  const replay = useCallback(() => {
    setWorkspaceUnlocked(false);
    setFirstMove(false);
    setStation("region");
    setActiveModule("crag-locator");
    setIntroMode("cinematic");
    setReplayKey((current) => current + 1);
  }, []);

  return (
    <main className={styles.previewApp} data-unlocked={workspaceUnlocked ? "true" : "false"}>
      <IntroScrubSequence
        key={replayKey}
        sequence={registry.introScrubSequence}
        mode={introMode}
        onUnlock={unlock}
        allowPostUnlockScrub
        onFirstMove={() => setFirstMove(true)}
      />

      {!workspaceUnlocked && <IntroGuide firstMove={firstMove} />}

      {workspaceUnlocked && (
        <section className={styles.unifiedShell} aria-label="Unified Explore workspace">
          <header className={styles.header}>
            <div className={styles.wordmark}>
              <OfficialMark variant="iridescent-vm" size={34} decorative priority />
              <div><small>Vertical Moment</small><strong>Explore / Unified</strong></div>
            </div>
            <div className={styles.context}>
              <span>Working reference</span>
              <strong>Wachau <i>→</i> Nasenwand <i>→</i> Upper</strong>
            </div>
            <div className={styles.headerActions}>
              <span className={styles.livePill}>Preview mode</span>
              <button type="button" onClick={() => chooseModule("crag-locator")}>Atlas</button>
              <button type="button" onClick={replay}>Replay flight</button>
            </div>
          </header>

          <nav className={styles.stationRail} aria-label="Explore journey stations">
            <div className={styles.railHeading}><small>Flight path</small><strong>Navigate the same place at four scales</strong></div>
            {STATIONS.map((candidate) => (
              <button key={candidate.id} type="button" className={styles.stationButton} aria-pressed={candidate.id === station} onClick={() => chooseStation(candidate.id)}>
                <span className={styles.stationIndex}>{candidate.index}</span>
                <span><b>{candidate.label}</b><small>{candidate.title}</small></span>
              </button>
            ))}
          </nav>

          <section className={styles.mapStage} aria-label="Atlas map canvas">
            <div className={styles.stageHeader}>
              <div><small>Canonical atlas · region / crag / route</small><strong>Move through the map, keep the wall in sight.</strong></div>
              <span>{stationInfo.label} <i>·</i> Nasenwand reference</span>
            </div>
            <div className={styles.mapViewport}>
              <Suspense fallback={<div className={styles.mapLoading}>Preparing the live atlas…</div>}><CragLocator /></Suspense>
            </div>
            <div className={styles.mapBadge}><span>Background flight</span><strong>Scrub remains live behind the workspace</strong><small>Use the timeline below the scene, or drag the open background.</small></div>
          </section>

          <aside className={styles.moduleTray} aria-label="Focused Explore layer">
            <header className={styles.trayHeader}>
              <div><small>{activeModule === "crag-locator" ? "The map is the module" : `${activeContent?.crag ?? "Nasenwand"} · focused layer`}</small><strong>{MODULES.find((module) => module.id === activeModule)?.label}</strong></div>
              <span className={styles.weightTag}>{MODULES.find((module) => module.id === activeModule)?.weight}</span>
            </header>
            <p className={styles.trayHint}>{MODULES.find((module) => module.id === activeModule)?.hint}</p>
            <div className={styles.moduleBody}>
              <ModuleBody id={activeModule} registry={registry} />
            </div>
          </aside>

          <nav className={styles.moduleRail} aria-label="Explore layers">
            <div className={styles.moduleRailLabel}><small>One tray</small><strong>Five layers</strong></div>
            {MODULES.map((module) => (
              <button key={module.id} type="button" aria-pressed={module.id === activeModule} data-weight={module.weight.toLowerCase()} onClick={() => chooseModule(module.id)}>
                <span>{module.label}</span><small>{module.weight}</small>
              </button>
            ))}
          </nav>

          <footer className={styles.footerNote}>
            <span><b>One focused layer at a time.</b> Heavy media opens on intent.</span>
            <span>{stationInfo.copy}</span>
          </footer>
        </section>
      )}
    </main>
  );
}
