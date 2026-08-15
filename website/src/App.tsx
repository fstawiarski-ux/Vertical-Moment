"use client";

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IntroScrubSequence, type UnlockReason } from "./components/animation/IntroScrubSequence";
import { Box3DModel } from "./components/boxes/Box3DModel";
import { BoxContainer } from "./components/boxes/BoxContainer";
import { ResponsiveImage } from "./components/media/ResponsiveImage";
import { CommandPalette } from "./components/shell/CommandPalette";
import { ConnectionStatus } from "./components/shell/ConnectionStatus";
import { LayoutToolbar } from "./components/shell/LayoutToolbar";
import { PhoneShell } from "./components/shell/PhoneShell";
import { StationPeek } from "./components/shell/StationPeek";
import { DesktopShell, TabletShell } from "./components/shell/WorkspaceShells";
import { UnifiedExplorePreview } from "./components/UnifiedExplorePreview";
import { deepLinkFor, parseDeepLink, resolveDeepLink, writeDeepLinkToUrl } from "./core/deepLink";
import { hasSeenIntro, prefersReducedMotion, rememberIntroSeen } from "./core/introPreferences";
import { LayoutProvider, useLayoutState } from "./core/layoutState";
import { stationFrameForBox } from "./core/layoutAlgorithms";
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
  ViewportMode,
} from "./core/types";
import { STATION_PRESENTATIONS, stationForFocusBoxId } from "./core/stationPresentation";
import { useViewportMode } from "./hooks/useViewportMode";
import { ServiceWorkerRegistration } from "./pwa/sw-registration";
import styles from "./ExploreApp.module.css";

const CragLocator = lazy(() => import("./components/boxes/BoxCragLocator"));
const NasenwandRoutes = lazy(() => import("./components/boxes/BoxNasenwandRoutes"));
const WachauPanorama = lazy(() => import("./components/boxes/BoxWachauPanorama"));
const WallReveal = lazy(() => import("./components/boxes/BoxWallReveal"));

function seedLayout(registry: ExploreContentRegistry, viewport?: { width: number; height: number }): LayoutState {
  return {
    boxes: registry.boxes.map((box, index) => ({
      id: box.id,
      type: box.type,
      ...box.initialLayout,
      ...(stationFrameForBox(box.id, viewport) ?? {}),
      zIndex: index + 1,
      // Start with one readable focal module and keep the rest recoverable
      // from the dock. Journey follow mode restores the station focus when it
      // needs to surface a different recommendation.
      mode: box.id === STATION_PRESENTATIONS.topo.focusBoxId ? "normal" : "minimized",
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
        <small>20 regions · 330 crags · 2,402 routes</small>
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
        <small>3-stage story - shared media</small>
        <strong>Wall Reveal</strong>
        <p>Move from place to provisional topo without duplicating heavy media.</p>
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

function Workspace({ registry }: { registry: ExploreContentRegistry }) {
  const viewportMode = useViewportMode();
  const [introMode, setIntroMode] = useState<IntroMode | null>(null);
  const [workspaceUnlocked, setWorkspaceUnlocked] = useState(false);
  const [journeyStation, setJourneyStation] = useState<JourneyStation>("region");
  const [stationPeekVisible, setStationPeekVisible] = useState(false);
  const [followJourney, setFollowJourney] = useState(false);
  const [replayCount, setReplayCount] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");

  const boxes = useLayoutState((state) => state.boxes);
  const activeBoxId = useLayoutState((state) => state.activeBoxId);
  const layoutHydrated = useLayoutState((state) => state.hydrated);
  const dispatch = useLayoutState((state) => state.dispatch);
  const undo = useLayoutState((state) => state.undo);
  const redo = useLayoutState((state) => state.redo);
  const reset = useLayoutState((state) => state.reset);

  const contentById = useMemo(() => new Map(registry.boxes.map((box) => [box.id, box])), [registry]);
  const activeContent = activeBoxId ? contentById.get(activeBoxId) ?? null : null;
  const deepLinkApplied = useRef(false);
  const mobileLayoutNormalized = useRef(false);
  const previousViewportMode = useRef<ViewportMode | null>(null);

  // Focus handling reads the live box list, but the window listener below must
  // not resubscribe on every drag frame — hence the ref rather than a dep.
  const boxesRef = useRef(boxes);
  useEffect(() => { boxesRef.current = boxes; }, [boxes]);

  const focusBox = useCallback((id: string, mode: BoxMode = "expanded", normalizeSiblings = true) => {
    if (!contentById.has(id)) return;
    if (mode !== "normal" && normalizeSiblings) {
      for (const box of boxesRef.current) {
        if (box.id !== id && box.mode !== "minimized") {
          dispatch({ type: "SET_BOX_MODE", id: box.id, mode: "minimized" });
        }
      }
    }
    dispatch({ type: "SET_BOX_MODE", id, mode });
    dispatch({ type: "SET_ACTIVE_BOX", id });
  }, [contentById, dispatch]);

  const openIndependentBox = useCallback((id: string, mode: BoxMode = "expanded", resetFrame = mode === "normal") => {
    setFollowJourney(false);
    setStationPeekVisible(false);
    if (resetFrame && mode === "normal" && viewportMode === "desktop") {
      const frame = stationFrameForBox(id, { width: window.innerWidth, height: window.innerHeight });
      if (frame) dispatch({ type: "UPDATE_BOX", id, patch: frame });
    }
    for (const other of boxesRef.current) {
      if (other.id !== id && other.mode !== "minimized") {
        dispatch({ type: "SET_BOX_MODE", id: other.id, mode: "minimized" });
      }
    }
    focusBox(id, mode, false);
  }, [dispatch, focusBox, viewportMode]);

  const replayIntro = useCallback(() => {
    setWorkspaceUnlocked(false);
    setJourneyStation("region");
    setStationPeekVisible(false);
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
    // The canvas and its focused module carry the context; keep the floating
    // recommendation card out of the map/3D safe area.
    setStationPeekVisible(false);
    // Keep the canvas hidden during the handoff. A deep link is opened by the
    // effect below; a normal arrival keeps only the recommendation visible.
    setFollowJourney(true);
    if (reason !== "static") void rememberIntroSeen();
  }, [registry]);

  useEffect(() => {
    const onStation = (event: Event) => {
      const detail = (event as CustomEvent<ScrubStationEventDetail>).detail;
      if (!detail || !STATION_PRESENTATIONS[detail.station]) return;
      setJourneyStation(detail.station);
      setStationPeekVisible(false);
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
    const previousMode = previousViewportMode.current;
    previousViewportMode.current = viewportMode;

    if (viewportMode === "tablet") {
      dispatch({ type: "SET_LAYOUT_MODE", mode: "grid" });
      dispatch({ type: "APPLY_AUTO_LAYOUT", viewport: { width: window.innerWidth, height: window.innerHeight } });
      return;
    }

    if (viewportMode === "desktop" && previousMode !== "desktop") {
      dispatch({ type: "SET_LAYOUT_MODE", mode: "explore" });
      for (const box of boxesRef.current) {
        if (box.mode === "minimized") continue;
        const frame = stationFrameForBox(box.id, { width: window.innerWidth, height: window.innerHeight });
        if (frame) dispatch({ type: "UPDATE_BOX", id: box.id, patch: frame });
      }
    }
  }, [dispatch, viewportMode]);

  useEffect(() => {
    if (viewportMode !== "mobile") {
      mobileLayoutNormalized.current = false;
      return;
    }
    if (!layoutHydrated || mobileLayoutNormalized.current) return;
    mobileLayoutNormalized.current = true;
    const focusId = activeBoxId ?? STATION_PRESENTATIONS[journeyStation].focusBoxId;
    for (const box of boxesRef.current) {
      const targetMode = box.id === focusId ? "normal" : "minimized";
      if (box.mode !== targetMode) dispatch({ type: "SET_BOX_MODE", id: box.id, mode: targetMode });
    }
  }, [activeBoxId, dispatch, journeyStation, layoutHydrated, viewportMode]);

  useEffect(() => {
    if (!workspaceUnlocked || !followJourney) return;
    const focusedBox = boxesRef.current.find((box) => box.id === STATION_PRESENTATIONS[journeyStation].focusBoxId);
    if (focusedBox?.mode === "minimized") {
      // Journey focus may restore a card, but it never changes the visitor's
      // saved frame or size.
      dispatch({ type: "SET_BOX_MODE", id: focusedBox.id, mode: "normal" });
    }
  }, [dispatch, followJourney, journeyStation, boxes, workspaceUnlocked]);

  // Deep links wait for the workspace so the opened box is not hidden behind
  // an intro that is still running.
  useEffect(() => {
    if (!workspaceUnlocked || !layoutHydrated || deepLinkApplied.current) return;
    deepLinkApplied.current = true;
    const target = resolveDeepLink(parseDeepLink(window.location.search), registry);
    if (target) {
      const station = stationForFocusBoxId(target.boxId);
      if (station) {
        setJourneyStation(station);
        setStationPeekVisible(false);
        openIndependentBox(target.boxId, target.mode);
      } else {
        openIndependentBox(target.boxId, target.mode);
      }
    }
  }, [layoutHydrated, openIndependentBox, registry, workspaceUnlocked]);

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

  const openStationBox = useCallback((id: string) => {
    openIndependentBox(id, "normal", true);
  }, [openIndependentBox]);

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

  const stationFocusId = STATION_PRESENTATIONS[journeyStation].focusBoxId;
  const journeyActive = workspaceUnlocked && followJourney;

  const renderBox = (box: BoxState) => {
    const content = contentById.get(box.dataRef ?? box.id);
    if (!content) return null;
    return (
      <BoxContainer
        key={box.id}
        box={box}
        title={content.title}
        eyebrow={`${content.crag} · ${content.type === "nasenwand" ? "routes" : content.type === "wallreveal" ? "story" : content.type}`}
        viewportMode={viewportMode}
      >
        <BoxContent
          content={content}
          isActive={activeBoxId === box.id || (journeyActive && stationFocusId === box.id)}
          priority={content.id === registry.boxes[0]?.id}
        />
      </BoxContainer>
    );
  };

  const exclusiveBox = boxes.find((box) => box.mode === "fullscreen") ?? boxes.find((box) => box.mode === "expanded");
  const exclusiveMode = exclusiveBox?.mode ?? "none";
  // Station-follow mode keeps the mapped box mounted as a normal canvas item.
  // The module remains lazy because it is not the active box until the visitor
  // explicitly opens it, while the box itself stays draggable and resizable.
  const visible = exclusiveBox
    ? boxes.filter((box) => box.id === exclusiveBox.id)
    : journeyActive
      ? boxes.filter((box) => box.id === stationFocusId && box.mode !== "minimized")
      : boxes.filter((box) => box.mode !== "minimized");
  const boxesById = useMemo(() => new Map(boxes.map((box) => [box.id, box])), [boxes]);
  const stationContent = contentById.get(stationFocusId) ?? null;
  const openPhoneBox = useCallback((id: string) => openIndependentBox(id, "normal", true), [openIndependentBox]);
  const openContributor = useCallback(() => {
    window.location.assign("/contribute?source=explore-app");
  }, []);

  return (
    <main className={styles.app} data-viewport={viewportMode} data-station-peek={stationPeekVisible ? "true" : "false"}>
      <IntroScrubSequence
        key={replayCount}
        sequence={registry.introScrubSequence}
        mode={introMode}
        onUnlock={handleUnlock}
        allowPostUnlockScrub={workspaceUnlocked}
      />
      {stationPeekVisible && (
        <StationPeek
          station={journeyStation}
          content={stationContent}
          onOpen={workspaceUnlocked ? openStationBox : undefined}
        />
      )}
      <ConnectionStatus />

      {workspaceUnlocked && viewportMode === "mobile" && (
        <PhoneShell
          registry={registry}
          boxes={boxes}
          activeBoxId={activeBoxId}
          stationContent={stationContent}
          renderBox={renderBox}
          onOpenBox={openPhoneBox}
          onSearch={() => openPalette("")}
          onContribute={openContributor}
          onToggleJourney={() => setFollowJourney((current) => !current)}
          followJourney={followJourney}
        />
      )}
      {workspaceUnlocked && viewportMode === "tablet" && (
        <TabletShell visible={visible} renderBox={renderBox} exclusiveMode={exclusiveMode} />
      )}
      {workspaceUnlocked && viewportMode === "desktop" && (
        <DesktopShell visible={visible} renderBox={renderBox} exclusiveMode={exclusiveMode} />
      )}

      {workspaceUnlocked && (
        <aside className={styles.workspaceDock} aria-label="Open or restore Explore modules">
          <div className={styles.dockLabel}>
            <strong>Modules</strong>
            <span>Open or restore</span>
          </div>
          <div className={styles.dockItems}>
            {registry.boxes.map((content) => {
              const box = boxesById.get(content.id);
              const isCurrent = content.id === activeBoxId || (journeyActive && content.id === stationFocusId);
              const action = box?.mode === "minimized" ? "Restore" : "Open";
              return (
                <button
                  key={content.id}
                  type="button"
                  className={styles.workspaceDockButton}
                  data-current={isCurrent ? "true" : "false"}
                  aria-current={isCurrent ? "page" : undefined}
                  title={`${action} ${content.title}`}
                  aria-label={`${action} ${content.title}`}
                  onClick={() => openIndependentBox(content.id, "normal", box?.mode !== "minimized")}
                >
                  <span>{content.title}</span>
                  <small>{action}</small>
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {workspaceUnlocked && (
        <LayoutToolbar
          viewportMode={viewportMode}
          offlinePack={[...(registry.offlineData ?? []), ...registry.offlinePack]}
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
  const [unifiedPreview, setUnifiedPreview] = useState(false);
  const initialState = useMemo(() => {
    if (!registry) return null;
    const viewport = typeof window === "undefined" ? undefined : { width: window.innerWidth, height: window.innerHeight };
    return seedLayout(registry, viewport);
  }, [registry]);

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

  useEffect(() => {
    setUnifiedPreview(new URLSearchParams(window.location.search).get("preview") === "unified");
  }, []);

  if (error) return <main className={styles.loading}><h1>Workspace could not start.</h1><p>{error}</p></main>;
  if (!registry || !initialState) return <main className={styles.loading}><span /><p>Preparing workspace…</p></main>;

  return (
    <>
      <ServiceWorkerRegistration />
      <LayoutProvider key={registry.version} initialState={initialState}>
        {unifiedPreview ? <UnifiedExplorePreview registry={registry} /> : <Workspace registry={registry} />}
      </LayoutProvider>
    </>
  );
}
