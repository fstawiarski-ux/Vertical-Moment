"use client";

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ScrollScrubHero } from "./components/animation/ScrollScrubHero";
import { Box3DModel } from "./components/boxes/Box3DModel";
import { BoxContainer } from "./components/boxes/BoxContainer";
import { ResponsiveImage } from "./components/media/ResponsiveImage";
import { LayoutToolbar } from "./components/shell/LayoutToolbar";
import { LockedBackground } from "./components/shell/LockedBackground";
import { LayoutProvider, useLayoutState } from "./core/layoutState";
import type { BoxState, ExploreContentBox, ExploreContentRegistry, LayoutState } from "./core/types";
import { useViewportMode } from "./hooks/useViewportMode";
import { ServiceWorkerRegistration } from "./pwa/sw-registration";
import styles from "./ExploreApp.module.css";

const CragLocator = lazy(() => import("./components/boxes/BoxCragLocator"));
const NasenwandRoutes = lazy(() => import("./components/boxes/BoxNasenwandRoutes"));
const WachauPanorama = lazy(() => import("./components/boxes/BoxWachauPanorama"));

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
    heroBoxId: null,
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

function BoxContent({ content, isActive, priority = false }: { content: ExploreContentBox; isActive: boolean; priority?: boolean }) {
  if (content.type === "atlas") return <AtlasModule isActive={isActive} />;
  if (content.type === "panorama") return <PanoramaModule isActive={isActive} />;
  if (content.type === "nasenwand") return <NasenwandModule isActive={isActive} />;

  if (content.type === "model3d" && content.model) {
    return <Box3DModel model={content.model} poster={content.image} isActive={isActive} />;
  }

  return (
    <div className={styles.boxContent}>
      {content.image && <ResponsiveImage image={content.image} priority={priority} />}
      <div className={styles.boxCopy}>
        <p>{content.description}</p>
        <span>Promote this box to make it the locked hero.</span>
      </div>
    </div>
  );
}

function Workspace({ registry }: { registry: ExploreContentRegistry }) {
  const viewportMode = useViewportMode();
  const boxes = useLayoutState((state) => state.boxes);
  const activeBoxId = useLayoutState((state) => state.activeBoxId);
  const heroBoxId = useLayoutState((state) => state.heroBoxId);
  const hydrated = useLayoutState((state) => state.hydrated);
  const dispatch = useLayoutState((state) => state.dispatch);
  const contentById = useMemo(() => new Map(registry.boxes.map((box) => [box.id, box])), [registry]);
  const heroContent = heroBoxId ? contentById.get(heroBoxId) : undefined;
  const background = heroContent?.image ?? registry.background;

  useEffect(() => {
    if (viewportMode === "tablet") {
      dispatch({ type: "SET_LAYOUT_MODE", mode: "grid" });
      dispatch({ type: "APPLY_AUTO_LAYOUT", viewport: { width: window.innerWidth, height: window.innerHeight } });
    }
  }, [dispatch, viewportMode]);

  useEffect(() => {
    const focusRequestedBox = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string; mode?: "normal" | "expanded" | "fullscreen" }>).detail;
      if (!detail?.id || !contentById.has(detail.id)) return;
      const nextMode = detail.mode ?? "expanded";
      if (nextMode !== "normal") {
        for (const box of boxes) {
          if (box.id !== detail.id && (box.mode === "expanded" || box.mode === "fullscreen")) {
            dispatch({ type: "UPDATE_BOX", id: box.id, patch: { mode: "normal" } });
          }
        }
      }
      dispatch({ type: "UPDATE_BOX", id: detail.id, patch: { mode: nextMode } });
      dispatch({ type: "SET_ACTIVE_BOX", id: detail.id });
    };
    window.addEventListener("vm:focus-box", focusRequestedBox);
    return () => window.removeEventListener("vm:focus-box", focusRequestedBox);
  }, [boxes, contentById, dispatch]);

  const renderBox = (box: BoxState) => {
    const content = contentById.get(box.dataRef ?? box.id);
    if (!content || box.id === heroBoxId) return null;
    return (
      <BoxContainer key={box.id} box={box} title={content.title} eyebrow={`${content.crag} · ${content.type}`} viewportMode={viewportMode}>
        <BoxContent content={content} isActive={activeBoxId === box.id} priority={content.id === registry.boxes[0]?.id} />
      </BoxContainer>
    );
  };

  const visible = boxes.filter((box) => box.mode !== "minimized");
  const minimized = boxes.filter((box) => box.mode === "minimized" && box.id !== heroBoxId);

  return (
    <main className={styles.app} data-viewport={viewportMode}>
      <LockedBackground image={background} isPromoted={Boolean(heroBoxId)} />
      <ScrollScrubHero asset={registry.scrollScrubHero} visible={!heroBoxId} />
      <header className={styles.brand}>
        <span className={styles.mark} aria-hidden="true" />
        <div><small>Vertical Moment</small><strong>Explore Lab</strong></div>
        <p>{hydrated ? "Layout saved locally" : "Loading local layout…"}</p>
      </header>

      {viewportMode === "mobile" ? (
        <section className={styles.cardStack} aria-label="Explore cards">
          {visible.map(renderBox)}
        </section>
      ) : (
        <section className={styles.boxLayer} data-layout={viewportMode} aria-label="Explore canvas">
          {visible.map(renderBox)}
        </section>
      )}

      {minimized.length > 0 && (
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
                onClick={() => {
                  dispatch({ type: "UPDATE_BOX", id: box.id, patch: { mode: "normal" } });
                  dispatch({ type: "SET_ACTIVE_BOX", id: box.id });
                }}
              >
                <span>{content.title.slice(0, 1)}</span>
              </button>
            );
          })}
        </aside>
      )}
      <LayoutToolbar viewportMode={viewportMode} offlinePack={registry.offlinePack} />
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
          setRegistry((current) => current?.version === content.version && current.updatedAt === content.updatedAt ? current : content);
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
