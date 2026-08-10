'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PLACE_WALL_FRAMES, WALL_SECTOR_FRAMES } from './nasenwand-flagship-frames';
import styles from './nasenwand-flagship.module.css';

type Chapter = 0 | 1 | 2 | 3;

type Route = { name: string; grade: string; length?: string; pitches?: string };

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
  { label: 'Wall', kicker: 'Nasenwand · Wall', title: 'Meet Nasenwand.', body: 'The regional approach finishes on the wall. The close-wall pass is preloaded for the sector handoff.' },
  { label: 'Sector', kicker: 'Nasenwand · Upper Sector', title: 'Read the sector.', body: 'A second, separate drone pass moves around the wall before any topo information is shown.' },
  { label: 'Topo', kicker: 'Upper Sector · 12 routes', title: 'Pick a route.', body: 'Routes are ordered left-to-right in the belt. Select one for detail, 3D, media and files.' },
] as const;

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const frameAt = (frames: string[], t: number) => frames[Math.round(clamp(t) * (frames.length - 1))];

export default function NasenwandFlagshipExplorer() {
  const runway = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<Route>(ROUTES[5]);
  const [panoIndex, setPanoIndex] = useState(1);
  const [panoZoom, setPanoZoom] = useState(1);

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

  const chapter: Chapter = progress < .25 ? 0 : progress < .44 ? 1 : progress < .78 ? 2 : 3;
  const pass1T = clamp(progress / .44);
  const pass2T = clamp((progress - .44) / .34);
  const topoT = clamp((progress - .80) / .14);

  const pass1 = frameAt(PLACE_WALL_FRAMES, pass1T);
  const pass2 = frameAt(WALL_SECTOR_FRAMES, pass2T);
  const c = CHAPTERS[chapter];

  const panoramas = useMemo(() => [
    '/photography/panoramas/wachau/wachau-07-preview.webp',
    '/photography/panoramas/wachau/wachau-09-preview.webp',
    '/photography/panoramas/wachau/wachau-10-preview.webp',
    '/photography/panoramas/wachau/wachau-12-preview.webp',
    '/photography/panoramas/wachau/wachau-16-preview.webp',
  ], []);

  const jump = (i: Chapter) => {
    const stops = [.02, .29, .52, .86];
    const node = runway.current;
    if (!node) return;
    const max = node.offsetHeight - innerHeight;
    scrollTo({ top: node.offsetTop + max * stops[i], behavior: 'smooth' });
  };

  return (
    <div ref={runway} className={styles.runway}>
      <main className={styles.stage}>
        <header className={styles.topbar}>
          <a href="/" className={styles.brand}><b>VM</b><span>VERTICAL<br/>MOMENT</span></a>
          <div className={styles.crumbs}>WACHAU <i>/</i> NASENWAND <i>/</i> UPPER SECTOR</div>
          <div className={styles.topActions}><a href="/explore">Explore</a><a href="/">Home</a><span>☰</span></div>
        </header>

        <section className={styles.visualStage}>
          <img className={`${styles.scrub} ${progress >= .48 ? styles.hidden : ''}`} src={pass1} alt="Drone approach from the Wachau toward Nasenwand" />
          <img className={`${styles.scrub} ${styles.passTwo} ${progress >= .42 && progress < .86 ? styles.visible : ''}`} src={pass2} alt="Close-wall sector flyover at Nasenwand" />
          <div className={`${styles.topoLayer} ${topoT > 0 ? styles.topoVisible : ''}`} style={{ opacity: topoT }}>
            <img src="/photography/nasenwand/nasenwand-photo-2400.webp" alt="Nasenwand wall" />
            <img className={styles.routesOverlay} src="/photography/nasenwand/nasenwand-routes-2400.png" alt="" />
          </div>

          <nav className={styles.rail} aria-label="Explorer stages">
            {CHAPTERS.map((item, i) => <button key={item.label} className={chapter === i ? styles.activeRail : ''} onClick={() => jump(i as Chapter)}><span />{item.label}</button>)}
          </nav>

          <div className={styles.heroCopy}>
            <small>{c.kicker}</small>
            <h1>{chapter === 0 ? 'NASENWAND' : c.title}</h1>
            <p>{c.body}</p>
            {chapter < 3 && <em>SCROLL TO CONTINUE</em>}
          </div>

          <aside className={styles.infoCard}>
            <button className={styles.back} onClick={() => jump(chapter > 0 ? (chapter - 1) as Chapter : 0)}>← Back</button>
            {chapter < 3 ? <>
              <small>0{chapter + 1} / {c.label.toUpperCase()}</small>
              <h2>{c.title}</h2>
              <p>{c.body}</p>
              {chapter === 2 && <div className={styles.sectors}><button className={styles.selectedSector}>Upper <b>12</b></button><button>Central <b>39</b></button><button>Lower <b>33</b></button><button>Deeper <b>23</b></button></div>}
            </> : <>
              <small>UPPER SECTOR · SELECTED ROUTE</small>
              <h2 className={styles.routeName}>{selected.name}</h2>
              <div className={styles.grade}>{selected.grade}</div>
              <dl><div><dt>Length</dt><dd>{selected.length || '—'}</dd></div><div><dt>Pitches</dt><dd>{selected.pitches || '—'}</dd></div><div><dt>Aspect</dt><dd>SW</dd></div><div><dt>Style</dt><dd>Sport</dd></div></dl>
              <div className={styles.routeActions}><a href="/nasenwand-concepts">◇ 3D Model</a><a href="/nasenwand-concepts">▣ Media</a><a href="/explore">⌁ Files</a></div>
            </>}
          </aside>
        </section>

        <section className={`${styles.routeBelt} ${chapter === 3 ? styles.beltVisible : ''}`}>
          <div className={styles.beltHeader}><button onClick={() => jump(2)}>← Back to sectors</button><span>Nasenwand / <b>Upper Sector</b></span><small>12 routes · left → right</small></div>
          <div className={styles.routeTrack}>{ROUTES.map(route => <button key={route.name} onClick={() => setSelected(route)} className={selected.name === route.name ? styles.routeActive : ''}><strong>{route.name}</strong><span>{route.grade}</span><small>{[route.length, route.pitches].filter(Boolean).join(' · ') || 'route info'}</small></button>)}</div>
        </section>

        <section className={styles.panorama}>
          <div className={styles.panoCanvas}><img src={panoramas[panoIndex]} style={{ transform: `scale(${panoZoom})` }} alt="Wachau panorama" /></div>
          <button className={`${styles.panoArrow} ${styles.left}`} onClick={() => setPanoIndex((panoIndex + panoramas.length - 1) % panoramas.length)}>‹</button>
          <button className={`${styles.panoArrow} ${styles.right}`} onClick={() => setPanoIndex((panoIndex + 1) % panoramas.length)}>›</button>
          <div className={styles.panoTools}><span>Panorama · Wachau</span><button onClick={() => setPanoIndex((panoIndex + 1) % panoramas.length)}>Gallery</button><button onClick={() => setPanoZoom(1)}>Fit</button><button onClick={() => setPanoZoom(Math.max(1, panoZoom - .15))}>−</button><button onClick={() => setPanoZoom(Math.min(2.5, panoZoom + .15))}>+</button><a target="_blank" rel="noreferrer" href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=48.39575198431061,15.51663212296914">360° View</a></div>
        </section>
        <div className={styles.progress}><i style={{ width: `${progress * 100}%` }} /></div>
      </main>
    </div>
  );
}
