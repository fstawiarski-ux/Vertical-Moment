"use client";

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IntroScrubSequence, type UnlockReason } from "./components/animation/IntroScrubSequence";
import { Box3DModel } from "./components/boxes/Box3DModel";
import { BoxContainer } from "./components/boxes/BoxContainer";
import { ResponsiveImage } from "./components/media/ResponsiveImage";
import { CommandPalette } from "./components/shell/CommandPalette";
import { ContextBreadcrumb } from "./components/shell/ContextBreadcrumb";
import { LayoutToolbar } from "./components/shell/LayoutToolbar";
import { deepLinkFor, parseDeepLink, resolveDeepLink, writeDeepLinkToUrl } from "./core/deepLink";
import { hasSeenIntro, prefersReducedMotion, rememberIntroSeen } from "./core/introPreferences";
import { LayoutProvider, useLayoutState } from "./core/layoutState";
import { buildContentEntries, type SearchEntry } from "./core/searchIndex";
import type {
  BoxMode,
  BoxState,
  ExploreContentBox,
  ExploreContentRegistry,
  IntroMode,
  JourneyStation,
  LayoutState,
  ScrubStationEventDetail,
} from "./core/types";
import { STATION_PRESENTATIONS, stationForFocusBoxId } from "./core/stationPresentation";
import { useViewportMode } from "./hooks/useViewportMode";
import { ServiceWorkerRegistration } from "./pwa/sw-registration";
import styles from "./ExploreApp.module.css";

const CragLocator = lazy(() => import("./components/boxes/BoxCragLocator"));
const NasenwandRoutes = lazy(() => import("./components/boxes/BoxNasenwandRoutes"));
const WachauPanorama = lazy(() => import("./components/boxes/BoxWachauPanorama"));
const WallReveal = lazy(() => import("./components/boxes/BoxWallReveal"));

function seedLayout(registry: ExploreContentRegistry): LayoutState {
  return {
    boxes: registry.boxes.map((box, index) => ({
      id: box.id,
      type: box.type,
      x: box.initialLayout.x,
      y: box.initialLayout.y,
      width: box.initialLayout.width,
      height: box.initialLayout.height,
      zIndex: index + 1,
      mode: "normal",
      pinned: false,
      dataRef: box.id,
      stackIndex: index,
    })),
    activeBoxId: null,
    layoutMode: "explore",
  };
}

function AtlasModule({ isActive }: { isActive: boolean }) {
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (isActive) setRequested(true);
  }, [isActive]);

  if (!requested) {
    return (
      <div className={styles.moduleGate}>
        <small>26 regions · 187 crags · 2,314 routes</small>
        <strong>Crag Locator</strong>
        <p>The route data works offline. Live map tiles are cached as you explore.</p>
        <button type="button" onClick={() => setRequested(true)}>Open the Atlas</button>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className={styles.moduleLoading}>Loading the Atlas…</div>}>
      <CragLocator />
    </Suspense>
  );
}

function PanoramaModule({ isActive }: { isActive: boolean }) {
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (isActive) setRequested(true);
  }, [isActive]);

  if (!requested) {
    return (
      <div className={styles.moduleGate}>
        <small>9 studies - 10.3 MB optional offline pack</small>
        <strong>Wachau panorama workspace</strong>
        <p>Move from region to crag and sector detail, or open the public Google 360 degree sphere.</p>
        <button type="button" onClick={() => setRequested(true)}>Open panorama viewer</button>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className={styles.moduleLoading}>Loading the panoramas...</div>}>
      <WachauPanorama />
    </Suspense>
  );
}

function NasenwandModule({ isActive }: { isActive: boolean }) {
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (isActive) setRequested(true);
  }, [isActive]);

  if (!requested) {
    return (
      <div className={styles.moduleGate}>
        <small>4 sectors - Upper Sector route list integrated</small>
        <strong>Nasenwand route workspace</strong>
        <p>Read supplied route facts beside the photo and spatial study. Unverified route geometry stays hidden.</p>
        <button type="button" onClick={() => setRequested(true)}>Open Nasenwand</button>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className={styles.moduleLoading}>Loading Nasenwand...</div>}>
      <NasenwandRoutes />
    </Suspense>
  );
}

function WallRevealModule({ isActive }: { isActive: boolean }) {
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (isActive) setRequested(true);
  }, [isActive]);

  if (!requested) {
    return (
      <div className={styles.moduleGate}>
        <small>4-stage story - shared heavy media</small>
        <strong>Wall Reveal</strong>
        <p>Move from place to motion, provisional topo and 3D without duplicating the scrub or model.</p>
        <button type="button" onClick={() => setRequested(true)}>Open Wall Reveal</button>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className={styles.moduleLoading}>Loading Wall Reveal...</div>}>
      <WallReveal />
    </Suspense>
  );
}

function BoxContent({ content, isActive, priority = false }: { content: ExploreContentBox; isActive: boolean; priority?: boolean }) {
  if (content.type === "atlas") return <AtlasModule isActive={isActive} />;
  if (content.type === "panorama") return <PanoramaModule isActive={isActive} />;
  if (content.type === "nasenwand") return <NasenwandModule isActive={isActive} />;
  if (content.type === "wallreveal") return <WallRevealModule isActive={isActive} />;

  if (content.type === "model3d" && content.model) {
    return <Box3DModel model={content.model} poster={content.image} isActive={isActive} />;
  }

  return (
    <div className={styles.boxContent}>
      {content.image && <ResponsiveImage image={content.image} priority={priority} />}
      <div className={styles.boxCopy}>
        <p>{content.description}</p>
        <span>Resize or expand this box to bring its detail forward.</span>
      </div>
    </div>
  );
}

function StationPreview({ station, visible }: { station: JourneyStation; visible: boolean }) {
  const presentation = STATION_PRESENTATIONS[station];
  if (!visible) return null;

  return (
    <aside className={styles.stationPreview} data-station={station} aria-live="polite" aria-label={`${presentation.label} journey preview`}>
      <small>{presentation.label} · journey view</small>
      <strong>{presentation.title}</strong>
      <p>{presentation.description}</p>
      <span>{presentation.nextLabel}</span>
    </aside>
  );
}

function Workspace({ registry }: { registry: ExploreContentRegistry }) {
  const viewportMode = useViewportMode();
  const [introMode, setIntroMode] = useState<IntroMode | null>(null);
  const [workspaceUnlocked, setWorkspaceUnlocked] = useState(false);
  const [journeyStation, setJourneyStation] = useState<JourneyStation>("region");
  const [stationPreviewVisible, setStationPreviewVisible] = useState(false);
  const [followJourney, setFollowJourney] = useState(false);
  const [replayCount, setReplayCount] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");

  const boxes = useLayoutState((state) => state.boxes);
  const activeBoxId = useLayoutState((state) => state.activeBoxId);
  const dispatch = useLayoutState((state) => state.dispatch);
  const undo = useLayoutState((state) => state.undo);
  const redo = useLayoutState((state) => state.redo);
  const reset = useLayoutState((state) => state.reset);

  const contentById = useMemo(() => new Map(registry.boxes.map((box) => [box.id, box])), [registry]);
  const activeContent = activeBoxId ? contentById.get(activeBoxId) ?? null : null;
  const deepLinkApplied = useRef(false);

  // Focus handling reads the live box list, but the window listener below must
  // not resubscribe on every drag frame — hence the ref rather than a dep.
  const boxesRef = useRef(boxes);
  useEffect(() => { boxesRef.current = boxes; }, [boxes]);

  const focusBox = useCallback((id: string, mode: BoxMode = "expanded") => {
    if (!contentById.has(id)) return;
    if (mode !== "normal") {
      for (const box of boxesRef.current) {
        if (box.id !== id && (box.mode === "expanded" || box.mode === "fullscreen")) {
          dispatch({ type: "UPDATE_BOX", id: box.id, patch: { mode: "normal" } });
        }
      }
    }
    dispatch({ type: "UPDATE_BOX", id, patch: { mode } });
    dispatch({ type: "SET_ACTIVE_BOX", id });
  }, [contentById, dispatch]);

  const openIndependentBox = useCallback((id: string, mode: BoxMode = "expanded") => {
    setFollowJourney(false);
    for (const other of boxesRef.current) {
      if (other.id !== id && other.mode !== "minimized") {
        dispatch({ type: "UPDATE_BOX", id: other.id, patch: { mode: "minimized" } });
      }
    }
    focusBox(id, mode);
  }, [dispatch, focusBox]);

  const replayIntro = useCallback(() => {
    setWorkspaceUnlocked(false);
    setJourneyStation("region");
    setStationPreviewVisible(false);
    setFollowJourney(true);
    setIntroMode("cinematic");
    // Remounts the sequence so it restarts from Region rather than resuming.
    setReplayCount((current) => current + 1);
  }, []);

  const handleUnlock = useCallback((reason: UnlockReason) => {
    setWorkspaceUnlocked(true);
    const deepLinkTarget = resolveDeepLink(parseDeepLink(window.location.search), registry);
    const deepLinkStation = deepLinkTarget ? stationForFocusBoxId(deepLinkTarget.boxId) : null;
    setJourneyStation(deepLinkStation ?? "topo");
    setStationPreviewVisible(false);
    // Skip/static still land at a journey station; they should not expose all
    // seven boxes underneath the arrival box.
    setFollowJourney(deepLinkTarget ? Boolean(deepLinkStation) : true);
    if (reason !== "static") void rememberIntroSeen();
  }, [registry]);

  useEffect(() => {
    const onStation = (event: Event) => {
      const detail = (event as CustomEvent<ScrubStationEventDetail>).detail;
      if (!detail || !STATION_PRESENTATIONS[detail.station]) return;
      setJourneyStation(detail.station);
      if (detail.phase === "preview") {
        if (!workspaceUnlocked) setStationPreviewVisible(true);
        else setFollowJourney(true);
        return;
      }
      setStationPreviewVisible(!workspaceUnlocked);
      if (workspaceUnlocked) setFollowJourney(true);
    };

    window.addEventListener("vm:scrub-station", onStation);
    return () => window.removeEventListener("vm:scrub-station", onStation);
  }, [workspaceUnlocked]);

  /**
   * Decides how the journey opens. An explicit `?intro=` wins; otherwise a deep
   * link into a module, a previous visit, or a reduced-motion preference each
   * hand the visitor straight to the workspace.
   */
  useEffect(() => {
    let cancelled = false;
    const request = parseDeepLink(window.location.search);

    void (async () => {
      const seen = await hasSeenIntro();
      if (cancelled) return;
      if (request.intro === "play") {
        setIntroMode("cinematic");
        return;
      }
      const goStraightIn = request.intro === "skip"
        || Boolean(request.open || request.crag)
        || seen
        || prefersReducedMotion();
      setIntroMode(goStraightIn ? "static" : "cinematic");
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (viewportMode === "tablet") {
      dispatch({ type: "SET_LAYOUT_MODE", mode: "grid" });
      dispatch({ type: "APPLY_AUTO_LAYOUT", viewport: { width: window.innerWidth, height: window.innerHeight } });
    }
  }, [dispatch, viewportMode]);

  // Deep links wait for the workspace so the opened box is not hidden behind
  // an intro that is still running.
  useEffect(() => {
    if (!workspaceUnlocked || deepLinkApplied.current) return;
    deepLinkApplied.current = true;
    const target = resolveDeepLink(parseDeepLink(window.location.search), registry);
    if (target) {
      const station = stationForFocusBoxId(target.boxId);
      if (station) {
        setJourneyStation(station);
        setFollowJourney(true);
        focusBox(target.boxId, target.mode);
      } else {
        openIndependentBox(target.boxId, target.mode);
      }
    }
  }, [focusBox, openIndependentBox, registry, workspaceUnlocked]);

  // Keeps the address bar shareable: whatever is in focus is what a copied URL reopens.
  useEffect(() => {
    if (!workspaceUnlocked) return;
    writeDeepLinkToUrl(activeContent);
  }, [activeContent, workspaceUnlocked]);

  useEffect(() => {
    const onFocusRequest = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string; mode?: BoxMode }>).detail;
      if (detail?.id) {
        openIndependentBox(detail.id, detail.mode ?? "expanded");
      }
    };
    const onReplayRequest = () => replayIntro();

    window.addEventListener("vm:focus-box", onFocusRequest);
    window.addEventListener("vm:replay-intro", onReplayRequest);
    return () => {
      window.removeEventListener("vm:focus-box", onFocusRequest);
      window.removeEventListener("vm:replay-intro", onReplayRequest);
    };
  }, [openIndependentBox, replayIntro]);

  const leaveJourney = useCallback(() => setFollowJourney(false), []);

  const openPalette = useCallback((query: string) => {
    setPaletteQuery(query);
    setPaletteOpen(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        openPalette("");
        return;
      }

      // Undo and redo must not fight the palette's own text field.
      const target = event.target as HTMLElement | null;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;
      if (!(event.metaKey || event.ctrlKey) || key !== "z") return;
      event.preventDefault();
      if (event.shiftKey) redo(); else undo();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openPalette, redo, undo]);

  const searchEntries = useMemo<SearchEntry[]>(() => {
    const actions: SearchEntry[] = [
      {
        id: "action:auto-align",
        kind: "action",
        label: "Auto-align workspace",
        detail: "Layout",
        terms: "auto align tidy arrange layout snap",
        run: () => dispatch({ type: "APPLY_AUTO_LAYOUT", viewport: { width: window.innerWidth, height: window.innerHeight } }),
      },
      {
        id: "action:minimize-all",
        kind: "action",
        label: "Minimize all boxes",
        detail: "Layout",
        terms: "minimise minimize collapse hide all boxes clear",
        run: () => dispatch({ type: "MINIMIZE_ALL" }),
      },
      {
        id: "action:reset",
        kind: "action",
        label: "Reset layout",
        detail: "Layout",
        terms: "reset restore default original layout start over",
        run: reset,
      },
      {
        id: "action:undo",
        kind: "action",
        label: "Undo layout change",
        detail: "History",
        terms: "undo back revert step",
        shortcut: "Ctrl Z",
        run: undo,
      },
      {
        id: "action:redo",
        kind: "action",
        label: "Redo layout change",
        detail: "History",
        terms: "redo forward repeat step",
        shortcut: "Ctrl ⇧ Z",
        run: redo,
      },
      {
        id: "action:replay-intro",
        kind: "action",
        label: "Replay approach journey",
        detail: "Intro",
        terms: "replay intro journey scrub region rock sector topo approach again",
        run: replayIntro,
      },
    ];

    for (const mode of ["explore", "grid", "presentation"] as const) {
      actions.push({
        id: `action:layout-${mode}`,
        kind: "action",
        label: `Switch to ${mode === "presentation" ? "Present" : mode === "grid" ? "Grid" : "Explore"} layout`,
        detail: "Layout mode",
        terms: `layout mode ${mode} present grid explore`,
        run: () => dispatch({ type: "SET_LAYOUT_MODE", mode }),
      });
    }

    return [...buildContentEntries(registry), ...actions];
  }, [dispatch, redo, registry, replayIntro, reset, undo]);

  const onPaletteSelect = useCallback((entry: SearchEntry) => {
    setPaletteOpen(false);
    if (entry.run) {
      entry.run();
      return;
    }
    if (entry.boxId) openIndependentBox(entry.boxId);
  }, [openIndependentBox]);

  const onPaletteCopyLink = useCallback((entry: SearchEntry) => {
    const content = entry.boxId ? contentById.get(entry.boxId) : undefined;
    if (!content || !navigator.clipboard) return;
    void navigator.clipboard
      .writeText(`${window.location.origin}${deepLinkFor(content)}`)
      .catch(() => { /* Clipboard access can be blocked; the URL bar still holds the link. */ });
  }, [contentById]);

  const renderBox = (box: BoxState, journeyPresentation?: "focus" | "support") => {
    const content = contentById.get(box.dataRef ?? box.id);
    if (!content) return null;
    return (
      <BoxContainer
        key={box.id}
        box={box}
        title={content.title}
        eyebrow={`${content.crag} · ${content.type === "nasenwand" ? "routes" : content.type === "wallreveal" ? "story" : content.type}`}
        viewportMode={viewportMode}
        journeyPresentation={journeyPresentation}
        onManualInteraction={journeyPresentation ? leaveJourney : undefined}
      >
        <BoxContent content={content} isActive={journeyPresentation === "focus" || activeBoxId === box.id} priority={journeyPresentation === "focus" || content.id === registry.boxes[0]?.id} />
      </BoxContainer>
    );
  };

  const stationFocusId = STATION_PRESENTATIONS[journeyStation].focusBoxId;
  const journeyFocusBox = boxes.find((box) => box.id === stationFocusId) ?? boxes[0];
  const journeyCompanions = boxes.filter((box) => box.id !== journeyFocusBox?.id);
  const journeyActive = workspaceUnlocked && followJourney && Boolean(journeyFocusBox);
  const visible = journeyActive
    ? (journeyFocusBox ? [journeyFocusBox] : [])
    : boxes.filter((box) => box.mode !== "minimized");
  const minimized = boxes.filter((box) => box.mode === "minimized");
  const stationContent = contentById.get(stationFocusId) ?? null;

  return (
    <main className={styles.app} data-viewport={viewportMode}>
      <IntroScrubSequence
        key={replayCount}
        sequence={registry.introScrubSequence}
        mode={introMode}
        onUnlock={handleUnlock}
      />
      {!workspaceUnlocked && <StationPreview station={journeyStation} visible={stationPreviewVisible} />}
      <header className={styles.brand}>
        <span className={styles.mark} aria-hidden="true" />
        <div><small>Vertical Moment</small><strong>Explore Lab</strong></div>
        {workspaceUnlocked && <ContextBreadcrumb box={journeyActive ? stationContent : activeContent} onNavigate={openPalette} />}
      </header>

      {workspaceUnlocked && (viewportMode === "mobile" ? (
        <section className={styles.cardStack} aria-label="Explore cards">
          {visible.map((box) => renderBox(box, journeyActive ? "focus" : undefined))}
        </section>
      ) : (
        <section className={styles.boxLayer} data-layout={viewportMode} aria-label="Explore canvas">
          {visible.map((box) => renderBox(box, journeyActive ? "focus" : undefined))}
        </section>
      ))}

      {workspaceUnlocked && journeyActive && journeyCompanions.length > 0 && (
        <aside className={styles.stationTray} aria-label="Other journey views">
          <small>Other views</small>
          {journeyCompanions.map((box) => {
            const content = contentById.get(box.dataRef ?? box.id);
            if (!content) return null;
            return (
              <button
                key={box.id}
                type="button"
                title={`Open ${content.title} independently`}
                aria-label={`Open ${content.title} independently`}
                onClick={() => openIndependentBox(box.id)}
              >
                <span>{content.title.slice(0, 1)}</span>
                <strong>{content.title}</strong>
              </button>
            );
          })}
        </aside>
      )}

      {workspaceUnlocked && !journeyActive && minimized.length > 0 && (
        <aside className={styles.minimizedTray} aria-label="Minimized boxes">
          {minimized.map((box) => {
            const content = contentById.get(box.dataRef ?? box.id);
            if (!content) return null;
            return (
              <button
                key={box.id}
                type="button"
                title={`Restore ${content.title}`}
                aria-label={`Restore ${content.title}`}
                onClick={() => focusBox(box.id, "normal")}
              >
                <span>{content.title.slice(0, 1)}</span>
              </button>
            );
          })}
        </aside>
      )}

      {workspaceUnlocked && (
        <LayoutToolbar
          viewportMode={viewportMode}
          offlinePack={registry.offlinePack}
          onSearch={() => openPalette("")}
          onReplayIntro={replayIntro}
          followJourney={followJourney}
          onToggleFollowJourney={() => setFollowJourney((current) => !current)}
        />
      )}

      <CommandPalette
        open={paletteOpen}
        entries={searchEntries}
        initialQuery={paletteQuery}
        onClose={() => setPaletteOpen(false)}
        onSelect={onPaletteSelect}
        onCopyLink={onPaletteCopyLink}
      />
    </main>
  );
}

export default function ExploreApp({ initialRegistry }: { initialRegistry?: ExploreContentRegistry }) {
  const [registry, setRegistry] = useState<ExploreContentRegistry | null>(initialRegistry ?? null);
  const [error, setError] = useState<string | null>(null);
  const initialState = useMemo(() => registry ? seedLayout(registry) : null, [registry]);

  useEffect(() => {
    let cancelled = false;
    fetch("/explore-content.json", { cache: "no-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Content registry returned ${response.status}`);
        return response.json() as Promise<ExploreContentRegistry>;
      })
      .then((content) => {
        if (!cancelled) {
          setRegistry((current) => {
            // A previously installed service worker can briefly return an older
            // registry while the new worker activates. Never let that stale
            // response downgrade a server-rendered app that already has the
            // intro sequence required by this release.
            if (!content.introScrubSequence?.chapters?.length) return current;
            if (current && content.version < current.version) return current;
            return current?.version === content.version && current.updatedAt === content.updatedAt ? current : content;
          });
        }
      })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Content registry unavailable"); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <main className={styles.loading}><h1>Explore Lab could not start.</h1><p>{error}</p></main>;
  if (!registry || !initialState) return <main className={styles.loading}><span /><p>Preparing Explore Lab…</p></main>;

  return (
    <>
      <ServiceWorkerRegistration />
      <LayoutProvider key={registry.version} initialState={initialState}>
        <Workspace registry={registry} />
      </LayoutProvider>
    </>
  );
}
