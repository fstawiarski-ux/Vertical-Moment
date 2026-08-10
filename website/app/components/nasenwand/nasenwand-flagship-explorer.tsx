'use client';

import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PLACE_WALL_FRAMES } from './nasenwand-flagship-frames';
import styles from './nasenwand-flagship.module.css';

type Chapter = 0 | 1 | 2 | 3;
type Route = { name: string; grade: string; length?: string; pitches?: string };
type DragState = { x: number; y: number; originX: number; originY: number };

const ORBIT_DURATION = 110 / 30;

const ROUTES: Route[] = [
  { name: 'Hatschi!', grade: '5c' },
  { name: 'Nasenbärli', grade: '—' },
  { name: 'Nicht gesucht + doch gefunden', grade: '5+', length: '170 m', pitches: '8p' },
  { name: 'Zwickolo', grade: '6', length: '25 m', pitches: '1p' },
  { name: 'Uhu und Kakadu', grade: '6+', length: '25 m', pitches: '1p' },
  { name: 'Aufwind', grade: '6', length: '25 m', pitches: '1p' },
  { name: 'Bergrettungsweg', grade: '6+', length: '140 m', pitches: '5p' },
  { name: 'Tanz auf der Leiter', grade: '7-/7', length: '25 m', pitches: '1p' },
  { name: 'Ein bißchen unrund', grade: '7-/7', length: '25 m', pitches: '1p' },
  { name: 'Chaos im Westen', grade: '7+', length: '25 m', pitches: '1p' },
  { name: 'Die Prinzessin & das Prunkstück', grade: '8-', length: '25 m', pitches: '1p' },
  { name: 'Silberhochzeit', grade: '—' },
];

const CHAPTERS = [
  { label: 'Place', kicker: 'Wachau · Region', title: 'Find the wall.', body: 'Start over the Danube corridor and move directly toward Nasenwand.' },
  { label: 'Wall', kicker: 'Nasenwand · Wall', title: 'Meet Nasenwand.', body: 'The regional approach finishes on the wall before the close-wall orbit begins.' },
  { label: 'Sector', kicker: 'Nasenwand · Upper Sector', title: 'Read the sector.', body: 'The verified 110-frame orbit moves around the crag before the topo state.' },
  { label: 'Topo', kicker: 'Upper Sector · 12 routes', title: 'Pick a route.', body: 'Routes stay directly under the panorama. Select one for detail and secondary tools.' },
] as const;

const PANORAMAS = [
  '/photography/panoramas/wachau/wachau-07-preview.webp',
  '/photography/panoramas/wachau/wachau-09-preview.webp',
  '/photography/panoramas/wachau/wachau-10-preview.webp',
  '/photography/panoramas/wachau/wachau-12-preview.webp',
  '/photography/panoramas/wachau/wachau-16-preview.webp',
];

const CARD_IMAGES = [1, 2, 3, 4, 5, 6].map((n) => `/photography/nasenwand/media/context-card-${String(n).padStart(2, '0')}.webp`);
const REGIONS = ['Wachau', 'Hohe Wand', 'Helenental', 'Peilstein', 'Mödling'];
const WALL_CARDS = ['Nasenwand', 'Wall overview', 'Approach', 'Media'];
const SECTORS = [
  { name: 'Upper', count: 12 }, { name: 'Central', count: 39 }, { name: 'Lower', count: 33 }, { name: 'Deeper', count: 23 },
];

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const frameAt = (frames: string[], t: number) => frames[Math.round(clamp(t) * (frames.length - 1))];

export default function NasenwandFlagshipExplorer() {
  const runway = useRef<HTMLDivElement>(null);
  const orbitVideo = useRef<HTMLVideoElement>(null);
  const panoDrag = useRef<DragState | null>(null);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<Route>(ROUTES[5]);
  const [panoIndex, setPanoIndex] = useState(1);
  const [panoZoom, setPanoZoom] = useState(1);
  const [panoOffset, setPanoOffset] = useState({ x: 0, y: 0 });
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeSector, setActiveSector] = useState('Upper');

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
      try { video.currentTime = seek; } catch { /* metadata can still be loading */ }
    }
  }, [pass2T]);

  const selectedIndex = Math.max(0, ROUTES.findIndex((route) => route.name === selected.name));
  const infoImage = CARD_IMAGES[(chapter === 3 ? selectedIndex : chapter + 1) % CARD_IMAGES.length];

  const contextCards = useMemo(() => {
    if (chapter === 0) return REGIONS.map((name, i) => ({ name, meta: i === 0 ? 'flagship region' : 'platform region', image: CARD_IMAGES[i % CARD_IMAGES.length] }));
    if (chapter === 1) return WALL_CARDS.map((name, i) => ({ name, meta: i === 0 ? '107 routes · 4 sectors' : 'wall context', image: CARD_IMAGES[(i + 1) % CARD_IMAGES.length] }));
    if (chapter === 2) return SECTORS.map((sector, i) => ({ name: sector.name, meta: `${sector.count} routes`, image: CARD_IMAGES[(i + 2) % CARD_IMAGES.length] }));
    return [];
  }, [chapter]);

  const jump = (i: Chapter) => {
    const stops = [.02, .29, .55, .87];
    const node = runway.current;
    if (!node) return;
    const max = node.offsetHeight - innerHeight;
    scrollTo({ top: node.offsetTop + max * stops[i], behavior: 'smooth' });
  };

  const resetPano = () => {
    setPanoZoom(1);
    setPanoOffset({ x: 0, y: 0 });
  };

  const choosePano = (index: number) => {
    setPanoIndex((index + PANORAMAS.length) % PANORAMAS.length);
    resetPano();
  };

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (panoZoom <= 1) return;
    panoDrag.current = { x: event.clientX, y: event.clientY, originX: panoOffset.x, originY: panoOffset.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = panoDrag.current;
    if (!drag) return;
    setPanoOffset({ x: drag.originX + event.clientX - drag.x, y: drag.originY + event.clientY - drag.y });
  };
  const pointerUp = () => { panoDrag.current = null; };

  return (
    <div ref={runway} className={styles.runway}>
      <main className={styles.stage}>
        <header className={styles.topbar}>
          <a href="/" className={styles.brand} aria-label="Vertical Moment home">
            <span className={`vm-static-logo ${styles.brandLogo}`} aria-hidden="true" />
            <span>Vertical Moment</span>
          </a>
          <div className={styles.crumbs}>WACHAU <i>/</i> NASENWAND <i>/</i> {chapter === 3 ? 'UPPER SECTOR' : c.label.toUpperCase()}</div>
          <div className={styles.topActions}><a href="/explore">Explore</a><a href="/#work">Photography</a><a href="/technology">Technology</a><span>☰</span></div>
        </header>

        <section className={styles.panorama}>
          <div className={styles.panoCanvas} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
            <img src={PANORAMAS[panoIndex]} style={{ transform: `translate3d(${panoOffset.x}px,${panoOffset.y}px,0) scale(${panoZoom})` }} alt="Wachau panorama" draggable={false} />
          </div>
          <button className={`${styles.panoArrow} ${styles.left}`} onClick={() => choosePano(panoIndex - 1)} aria-label="Previous panorama">‹</button>
          <button className={`${styles.panoArrow} ${styles.right}`} onClick={() => choosePano(panoIndex + 1)} aria-label="Next panorama">›</button>
          <div className={styles.panoTools}>
            <button onClick={() => setGalleryOpen((open) => !open)}>Gallery</button>
            <button onClick={resetPano}>Fit</button>
            <button onClick={() => setPanoZoom((zoom) => Math.max(1, zoom - .2))}>−</button>
            <button onClick={() => setPanoZoom((zoom) => Math.min(3, zoom + .2))}>+</button>
            <a target="_blank" rel="noreferrer" href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=48.39575198431061,15.51663212296914">360°</a>
          </div>
          {galleryOpen && <div className={styles.panoGallery}>{PANORAMAS.map((src, i) => <button key={src} onClick={() => choosePano(i)} className={i === panoIndex ? styles.panoThumbActive : ''}><img src={src} alt="" /></button>)}</div>}
        </section>

        <section className={styles.contextBelt}>
          <div className={styles.beltTitle}><small>{chapter === 3 ? '04 / ROUTES' : `0${chapter + 1} / ${c.label.toUpperCase()}`}</small><b>{chapter === 3 ? 'Upper Sector' : chapter === 2 ? 'Choose a sector' : chapter === 1 ? 'Nasenwand' : 'Choose a region'}</b><span>{chapter === 3 ? '12 routes · left → right' : c.kicker}</span></div>
          <div className={styles.contextTrack}>
            {chapter === 3 ? ROUTES.map((route, i) => <button key={route.name} onClick={() => setSelected(route)} className={`${styles.contextCard} ${selected.name === route.name ? styles.contextActive : ''}`} style={{ backgroundImage: `linear-gradient(180deg,transparent,#080a08e8),url(${CARD_IMAGES[i % CARD_IMAGES.length]})` }}><strong>{route.name}</strong><span>{route.grade}</span><small>{[route.length, route.pitches].filter(Boolean).join(' · ') || 'route info'}</small></button>) : contextCards.map((card, i) => <button key={card.name} className={`${styles.contextCard} ${(chapter === 0 && i === 0) || (chapter === 1 && i === 0) || (chapter === 2 && card.name === activeSector) ? styles.contextActive : ''}`} onClick={() => chapter === 2 && setActiveSector(card.name)} style={{ backgroundImage: `linear-gradient(180deg,transparent,#080a08e8),url(${card.image})` }}><strong>{card.name}</strong><small>{card.meta}</small></button>)}
          </div>
        </section>

        <section className={styles.mainGrid}>
          <div className={styles.visualStage}>
            <img className={`${styles.scrub} ${progress >= .48 ? styles.hidden : ''}`} src={pass1} alt="Drone approach from the Wachau toward Nasenwand" />
            <video ref={orbitVideo} className={`${styles.scrub} ${styles.passTwo} ${progress >= .40 && progress < .84 ? styles.visible : ''}`} src="/photography/nasenwand/media/nasenwand-orbit-scrub-allkey.mp4" muted playsInline preload="auto" aria-label="Verified close-wall orbit scrub from 110 supplied frames" />
            <div className={`${styles.topoLayer} ${topoT > 0 ? styles.topoVisible : ''}`} style={{ opacity: topoT }}>
              <img src="/photography/nasenwand/nasenwand-photo-2400.webp" alt="Nasenwand wall" />
              <img className={styles.routesOverlay} src="/photography/nasenwand/nasenwand-routes-2400.png" alt="" />
              <span className={styles.referenceBadge}>REFERENCE OVERLAY · VERIFY BEFORE MERGE</span>
            </div>

            <div className={styles.heroCopy}>
              <small>{c.kicker}</small>
              <h1>{chapter === 0 ? 'NASENWAND' : c.title}</h1>
              <p>{c.body}</p>
              {chapter < 3 && <em>{chapter === 2 ? 'PASS 02 · 110 VERIFIED FRAMES' : 'SCROLL TO CONTINUE'}</em>}
            </div>

            <nav className={styles.rail} aria-label="Explorer stages">
              {CHAPTERS.map((item, i) => <button key={item.label} className={chapter === i ? styles.activeRail : ''} onClick={() => jump(i as Chapter)}><span />{item.label}</button>)}
            </nav>
          </div>

          <aside className={styles.infoRail} style={{ '--rail-image': `url(${infoImage})` } as CSSProperties}>
            <div className={styles.infoShade} />
            <div className={styles.infoContent}>
              <button className={styles.back} onClick={() => jump(chapter > 0 ? (chapter - 1) as Chapter : 0)}>← Back</button>
              {chapter < 3 ? <>
                <small>0{chapter + 1} / {c.label.toUpperCase()}</small>
                <h2>{c.title}</h2>
                <p>{c.body}</p>
                {chapter === 2 && <div className={styles.sectors}>{SECTORS.map((sector) => <button key={sector.name} onClick={() => setActiveSector(sector.name)} className={activeSector === sector.name ? styles.selectedSector : ''}>{sector.name} <b>{sector.count}</b></button>)}</div>}
                {chapter === 2 && <video className={styles.railMotion} src="/photography/nasenwand/media/close-wall-loop-lite.mp4" muted autoPlay loop playsInline />}
              </> : <>
                <small>UPPER SECTOR · SELECTED ROUTE</small>
                <h2 className={styles.routeName}>{selected.name}</h2>
                <div className={styles.grade}>{selected.grade}</div>
                <dl><div><dt>Length</dt><dd>{selected.length || '—'}</dd></div><div><dt>Pitches</dt><dd>{selected.pitches || '—'}</dd></div><div><dt>Position</dt><dd>{String(selectedIndex + 1).padStart(2, '0')} / 12</dd></div><div><dt>Sector</dt><dd>Upper</dd></div></dl>
                <div className={styles.routeActions}><button>Topo</button><button>Gallery</button><button>3D</button><button>Files</button></div>
              </>}
              <div className={styles.infoSpacer} />
              <span className={styles.reviewFlag}>Review branch · not production-approved</span>
            </div>
          </aside>
        </section>
        <div className={styles.progress}><i style={{ width: `${progress * 100}%` }} /></div>
      </main>
    </div>
  );
}
