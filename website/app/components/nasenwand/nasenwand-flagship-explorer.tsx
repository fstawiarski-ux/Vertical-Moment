'use client';

import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from 'react';
import { useEffect, useRef, useState } from 'react';
import { PLACE_WALL_FRAMES } from './nasenwand-flagship-frames';
import styles from './nasenwand-flagship.module.css';

type Chapter = 0 | 1 | 2 | 3;
type Route = { name: string; grade: string; length?: string; pitches?: string };
type Point = { x: number; y: number };
type PanoState = { zoom: number; x: number; y: number };
type Region = { name: string; meta: string; image: string };

const ORBIT_DURATION = 110 / 30;

const ROUTES: Route[] = [
  { name: 'Hatschi!', grade: '5c' },
  { name: 'Nasenbärli', grade: '—' },
  { name: 'Nicht gesucht + doch gefunden', grade: '5+', length: '170 m', pitches: '8p' },
  { name: 'Zwickolo', grade: '6' },
  { name: 'Uhu und Kakadu', grade: '6+' },
  { name: 'Aufwind', grade: '6' },
  { name: 'Bergrettungsweg', grade: '6+', length: '140 m', pitches: '5p' },
  { name: 'Tanz auf der Leiter', grade: '7-/7' },
  { name: 'Ein bißchen unrund', grade: '7-/7' },
  { name: 'Chaos im Westen', grade: '7+' },
  { name: 'Die Prinzessin & das Prunkstück', grade: '8-' },
  { name: 'Silberhochzeit', grade: '—' },
];

const CHAPTERS = [
  { label: 'Place', kicker: 'Wachau · Place', title: 'Nasenwand', body: 'Move through the approach while region, panorama and route context stay fixed around the media window.' },
  { label: 'Wall', kicker: 'Nasenwand · Wall', title: 'Meet the wall.', body: 'The wall remains readable while the persistent controls stay within thumb reach.' },
  { label: 'Sector', kicker: 'Nasenwand · Upper Sector', title: 'Read the sector.', body: 'The verified close-wall orbit becomes the sector transition before topo.' },
  { label: 'Topo', kicker: 'Upper Sector · 12 routes', title: 'Pick a route.', body: 'Use the route rail above the media and the compact informational panel on the right.' },
] as const;

const PANORAMAS = [
  '/photography/panoramas/wachau/wachau-07-preview.webp',
  '/photography/panoramas/wachau/wachau-09-preview.webp',
  '/photography/panoramas/wachau/wachau-10-preview.webp',
  '/photography/panoramas/wachau/wachau-12-preview.webp',
  '/photography/panoramas/wachau/wachau-16-preview.webp',
];

const CARD_IMAGES = [1, 2, 3, 4, 5, 6].map(
  (n) => `/photography/nasenwand/media/context-card-${String(n).padStart(2, '0')}.webp`,
);

const REGIONS: Region[] = [
  { name: 'Wachau', meta: 'Flagship', image: CARD_IMAGES[0] },
  { name: 'Hohe Wand', meta: '388 routes', image: CARD_IMAGES[1] },
  { name: 'Helenental', meta: '359 routes', image: CARD_IMAGES[2] },
  { name: 'Peilstein', meta: 'Region', image: CARD_IMAGES[3] },
  { name: 'Mödling', meta: '188 routes', image: CARD_IMAGES[4] },
  { name: 'Kaltenleutgebner Tal', meta: '261 routes', image: CARD_IMAGES[5] },
  { name: 'Fischauer Vorberge', meta: '145 routes', image: CARD_IMAGES[0] },
  { name: 'Pernitz', meta: '179 routes', image: CARD_IMAGES[1] },
];

const SECTORS = [
  { name: 'Upper', count: 12 },
  { name: 'Central', count: 39 },
  { name: 'Lower', count: 33 },
  { name: 'Deeper', count: 23 },
];

const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const frameAt = (frames: string[], t: number) => frames[Math.round(clamp(t) * (frames.length - 1))];

export default function NasenwandFlagshipExplorer() {
  const runway = useRef<HTMLDivElement>(null);
  const orbitVideo = useRef<HTMLVideoElement>(null);
  const regionTrack = useRef<HTMLDivElement>(null);
  const routeTrack = useRef<HTMLDivElement>(null);
  const panoPointers = useRef<Map<number, Point>>(new Map());
  const panoGesture = useRef<{
    startPoint?: Point;
    startOffset?: Point;
    startDistance?: number;
    startZoom?: number;
  }>({});
  const panoCurrent = useRef<PanoState>({ zoom: 1, x: 0, y: 0 });
  const trackDrag = useRef<{ kind: 'region' | 'route'; x: number; scrollLeft: number } | null>(null);
  const trackMoved = useRef(false);

  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<Route>(ROUTES[5]);
  const [panoIndex, setPanoIndex] = useState(1);
  const [panoState, setPanoState] = useState<PanoState>({ zoom: 1, x: 0, y: 0 });
  const [activeSector, setActiveSector] = useState('Upper');
  const [panelHidden, setPanelHidden] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const node = runway.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const max = Math.max(1, node.offsetHeight - window.innerHeight);
      setProgress(clamp(-rect.top / max));
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
    };
  }, []);

  const chapter: Chapter = progress < .24 ? 0 : progress < .43 ? 1 : progress < .79 ? 2 : 3;
  const pass1T = clamp(progress / .43);
  const pass2T = clamp((progress - .43) / .36);
  const topoT = clamp((progress - .80) / .13);
  const pass1 = frameAt(PLACE_WALL_FRAMES, pass1T);
  const c = CHAPTERS[chapter];

  useEffect(() => {
    const video = orbitVideo.current;
    if (!video) return;
    const seek = pass2T * ORBIT_DURATION;
    if (Math.abs(video.currentTime - seek) > .025) {
      try {
        video.currentTime = seek;
      } catch {
        // Metadata can still be loading during the first scroll gesture.
      }
    }
  }, [pass2T]);

  const selectedIndex = Math.max(0, ROUTES.findIndex((route) => route.name === selected.name));
  const activeSectorData = SECTORS.find((sector) => sector.name === activeSector) ?? SECTORS[0];
  const infoImage = CARD_IMAGES[selectedIndex % CARD_IMAGES.length];

  const jump = (i: Chapter) => {
    const stops = [.02, .29, .55, .87];
    const node = runway.current;
    if (!node) return;
    const max = node.offsetHeight - innerHeight;
    scrollTo({ top: node.offsetTop + max * stops[i], behavior: 'smooth' });
  };

  const scrollTrack = (kind: 'region' | 'route', direction: -1 | 1) => {
    const node = kind === 'region' ? regionTrack.current : routeTrack.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.min(460, node.clientWidth * .72), behavior: 'smooth' });
  };

  const trackPointerDown = (kind: 'region' | 'route', event: ReactPointerEvent<HTMLDivElement>) => {
    const node = kind === 'region' ? regionTrack.current : routeTrack.current;
    if (!node) return;
    trackMoved.current = false;
    trackDrag.current = { kind, x: event.clientX, scrollLeft: node.scrollLeft };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const trackPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = trackDrag.current;
    if (!drag) return;
    const node = drag.kind === 'region' ? regionTrack.current : routeTrack.current;
    if (!node) return;
    const dx = event.clientX - drag.x;
    if (Math.abs(dx) > 4) trackMoved.current = true;
    node.scrollLeft = drag.scrollLeft - dx;
  };

  const trackPointerUp = () => {
    trackDrag.current = null;
  };

  const suppressTrackClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!trackMoved.current) return;
    event.preventDefault();
    event.stopPropagation();
    trackMoved.current = false;
  };

  const applyPano = (next: PanoState) => {
    const normalized = {
      zoom: clamp(next.zoom, 1, 3),
      x: next.x,
      y: next.y,
    };
    panoCurrent.current = normalized;
    setPanoState(normalized);
  };

  const resetPano = () => applyPano({ zoom: 1, x: 0, y: 0 });

  const choosePano = (index: number) => {
    setPanoIndex((index + PANORAMAS.length) % PANORAMAS.length);
    resetPano();
  };

  const panoPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    panoPointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...panoPointers.current.values()];
    if (points.length === 1) {
      panoGesture.current = {
        startPoint: points[0],
        startOffset: { x: panoCurrent.current.x, y: panoCurrent.current.y },
      };
    } else if (points.length === 2) {
      panoGesture.current = {
        startDistance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
        startZoom: panoCurrent.current.zoom,
      };
    }
  };

  const panoPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panoPointers.current.has(event.pointerId)) return;
    panoPointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...panoPointers.current.values()];
    if (points.length === 1 && panoGesture.current.startPoint && panoGesture.current.startOffset) {
      applyPano({
        zoom: panoCurrent.current.zoom,
        x: panoGesture.current.startOffset.x + points[0].x - panoGesture.current.startPoint.x,
        y: panoGesture.current.startOffset.y + points[0].y - panoGesture.current.startPoint.y,
      });
    } else if (points.length === 2 && panoGesture.current.startDistance && panoGesture.current.startZoom) {
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      applyPano({
        zoom: panoGesture.current.startZoom * distance / panoGesture.current.startDistance,
        x: panoCurrent.current.x,
        y: panoCurrent.current.y,
      });
    }
  };

  const panoPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    panoPointers.current.delete(event.pointerId);
    const points = [...panoPointers.current.values()];
    if (points.length === 1) {
      panoGesture.current = {
        startPoint: points[0],
        startOffset: { x: panoCurrent.current.x, y: panoCurrent.current.y },
      };
    } else if (points.length === 0) {
      panoGesture.current = {};
    }
  };

  const panoWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    applyPano({
      ...panoCurrent.current,
      zoom: panoCurrent.current.zoom * (event.deltaY < 0 ? 1.08 : .92),
    });
  };

  return (
    <div ref={runway} className={styles.runway}>
      <main
        className={styles.stage}
        style={{ '--pano-bg': `url(${PANORAMAS[panoIndex]})` } as CSSProperties}
      >
        <header className={styles.topbar}>
          <div className={styles.headerIdentity}>
            <a href="/" className={styles.brand} aria-label="Vertical Moment home">
              <span className={`vm-static-logo ${styles.brandLogo}`} aria-hidden="true" />
              <span>Vertical Moment</span>
            </a>
            <nav className={styles.primaryNav} aria-label="Primary navigation">
              <a href="/explore">Explore</a>
              <a href="/#work">Photography</a>
            </nav>
          </div>

          <div className={styles.regionDock}>
            <button className={styles.regionArrow} onClick={() => scrollTrack('region', -1)} aria-label="Previous regions">‹</button>
            <div
              ref={regionTrack}
              className={styles.regionTrack}
              onPointerDown={(event) => trackPointerDown('region', event)}
              onPointerMove={trackPointerMove}
              onPointerUp={trackPointerUp}
              onPointerCancel={trackPointerUp}
              onClickCapture={suppressTrackClick}
            >
              {REGIONS.map((region, i) => (
                <button
                  key={region.name}
                  className={`${styles.regionCard} ${i === 0 ? styles.regionActive : ''}`}
                  style={{ backgroundImage: `linear-gradient(90deg,#09110dcc,#09110d44),url(${region.image})` }}
                >
                  <strong>{region.name}</strong>
                  <small>{region.meta}</small>
                </button>
              ))}
            </div>
            <button className={styles.regionArrow} onClick={() => scrollTrack('region', 1)} aria-label="Next regions">›</button>
          </div>

          <div className={styles.headerPanoramas} aria-label="Wachau panorama album">
            {PANORAMAS.map((src, i) => (
              <button
                key={src}
                onClick={() => choosePano(i)}
                className={i === panoIndex ? styles.panoThumbActive : ''}
                aria-label={`Show panorama ${i + 1}`}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        </header>

        <section className={styles.panorama}>
          <div
            className={styles.panoCanvas}
            onPointerDown={panoPointerDown}
            onPointerMove={panoPointerMove}
            onPointerUp={panoPointerUp}
            onPointerCancel={panoPointerUp}
            onWheel={panoWheel}
            onDoubleClick={resetPano}
          >
            <img
              src={PANORAMAS[panoIndex]}
              style={{ transform: `translate3d(${panoState.x}px,${panoState.y}px,0) scale(${panoState.zoom})` }}
              alt="Wachau panorama"
              draggable={false}
            />
          </div>
          <div className={styles.panoShade} />
          <a
            className={styles.view360}
            aria-label="Open 360 degree Street View"
            target="_blank"
            rel="noreferrer"
            href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=48.39575198431061,15.51663212296914"
          >
            <b>360°</b><small>View</small>
          </a>
          <span className={styles.panoHint}>Drag to explore · wheel / pinch to zoom · double-click to reset</span>
        </section>

        <section className={`${styles.workspace} ${panelHidden ? styles.panelHidden : ''}`}>
          <aside className={styles.sectorPanel}>
            <div className={styles.sectorShade} />
            <div className={styles.sectorContent}>
              <small>03 / Sector</small>
              <h2>{activeSector} Sector</h2>
              <div className={styles.sectorCount}>{activeSectorData.count}</div>
              <p>Choose a sector while the wall view, route rail and selected-route tools remain in place.</p>
              <div className={styles.sectorTabs}>
                {SECTORS.map((sector) => (
                  <button
                    key={sector.name}
                    onClick={() => setActiveSector(sector.name)}
                    className={activeSector === sector.name ? styles.selectedSector : ''}
                  >
                    {sector.name}<b>{sector.count}</b>
                  </button>
                ))}
              </div>
              <div className={styles.sectorSpacer} />
              <div className={styles.sectorActions}>
                <button className={styles.primaryAction}>Sector overview</button>
                <button>Approach</button>
                <button>Conditions</button>
              </div>
            </div>
          </aside>

          <section className={styles.routeBelt}>
            <button className={styles.routeArrow} onClick={() => scrollTrack('route', -1)} aria-label="Previous routes">‹</button>
            <div
              ref={routeTrack}
              className={styles.routeTrack}
              onPointerDown={(event) => trackPointerDown('route', event)}
              onPointerMove={trackPointerMove}
              onPointerUp={trackPointerUp}
              onPointerCancel={trackPointerUp}
              onClickCapture={suppressTrackClick}
            >
              {ROUTES.map((route, i) => (
                <button
                  key={route.name}
                  onClick={() => setSelected(route)}
                  className={`${styles.routeCard} ${selected.name === route.name ? styles.routeActive : ''}`}
                  style={{ backgroundImage: `linear-gradient(180deg,#0001,#050705ec),url(${CARD_IMAGES[i % CARD_IMAGES.length]})` }}
                >
                  <span className={styles.infoDot}>i</span>
                  <strong>{route.name}</strong>
                  <span className={styles.routeGrade}>{route.grade}</span>
                  <small>{[route.length, route.pitches].filter(Boolean).join(' · ') || 'route info'}</small>
                </button>
              ))}
            </div>
            <button className={styles.routeArrow} onClick={() => scrollTrack('route', 1)} aria-label="Next routes">›</button>
          </section>

          <div className={styles.visualStage}>
            <img className={`${styles.scrub} ${progress >= .48 ? styles.hidden : ''}`} src={pass1} alt="Drone approach from the Wachau toward Nasenwand" />
            <video
              ref={orbitVideo}
              className={`${styles.scrub} ${styles.passTwo} ${progress >= .40 && progress < .84 ? styles.visible : ''}`}
              src="/photography/nasenwand/media/nasenwand-orbit-scrub-allkey.mp4"
              muted
              playsInline
              preload="auto"
              aria-label="Verified close-wall orbit scrub from 110 supplied frames"
            />
            <div className={`${styles.topoLayer} ${topoT > 0 ? styles.topoVisible : ''}`} style={{ opacity: topoT }}>
              <img src="/photography/nasenwand/nasenwand-photo-2400.webp" alt="Nasenwand wall" />
              <span className={styles.topoBadge}>Topo geometry pending verification</span>
            </div>
            <div className={styles.stageShade} />

            <div className={styles.heroCopy}>
              <small>{c.kicker}</small>
              <h1>{c.title}</h1>
              <p>{c.body}</p>
            </div>
          </div>

          <aside className={styles.stageRail} aria-label="Explorer scroll stages">
            <nav className={styles.rail} aria-label="Explorer stages">
              {CHAPTERS.map((item, i) => (
                <button key={item.label} className={chapter === i ? styles.activeRail : ''} onClick={() => jump(i as Chapter)}>
                  <i />
                  <span><small>0{i + 1}</small><b>{item.label}</b></span>
                </button>
              ))}
            </nav>
          </aside>

          <aside className={styles.infoRail} style={{ '--rail-image': `url(${infoImage})` } as CSSProperties}>
            <div className={styles.infoShade} />
            <div className={styles.infoContent}>
              <button className={styles.back} onClick={() => jump(chapter > 0 ? (chapter - 1) as Chapter : 0)}>← Back</button>
              <small>Upper sector · selected route</small>
              <h2 className={styles.routeName}>{selected.name}</h2>
              <div className={styles.grade}>{selected.grade}</div>
              <dl>
                <div><dt>Length</dt><dd>{selected.length || '—'}</dd></div>
                <div><dt>Pitches</dt><dd>{selected.pitches || '—'}</dd></div>
                <div><dt>Position</dt><dd>{String(selectedIndex + 1).padStart(2, '0')} / 12</dd></div>
                <div><dt>Sector</dt><dd>Upper</dd></div>
              </dl>
              <div className={styles.routeActions}>
                <button>Topo</button><button>Gallery</button><button>3D</button><button>Files</button>
              </div>
              <div className={styles.infoSpacer} />
              <span className={styles.reviewFlag}>Layout approved · high-quality scrub masters pending</span>
            </div>
          </aside>
        </section>

        <button
          className={styles.hidePanel}
          onClick={() => setPanelHidden((hidden) => !hidden)}
          aria-expanded={!panelHidden}
        >
          <span>{panelHidden ? 'Show panel' : 'Hide panel'}</span><b>{panelHidden ? '‹' : '›'}</b>
        </button>

        <div className={styles.progress}><i style={{ width: `${progress * 100}%` }} /></div>
      </main>
    </div>
  );
}
