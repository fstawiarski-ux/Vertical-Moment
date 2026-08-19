'use client';

/* eslint-disable @next/next/no-img-element */

import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { panoramas } from '../../data/panoramas';
import { ensureModelViewer } from '../../components/model-viewer-loader';
import styles from './wall-reveal.module.css';

type StageId = 'place' | 'scrub' | 'topo' | 'model';
type PanelId = 'menu' | 'gallery' | 'panoramas' | 'budget' | null;

type Stage = {
  id: StageId;
  index: string;
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  action: string;
  status: string;
};

const stages: Stage[] = [
  {
    id: 'place',
    index: '01',
    label: 'Place',
    eyebrow: 'Nasenwand · Wachau',
    title: 'One wall. From place to route.',
    body: 'Begin with the real place: a light panorama that arrives quickly, even on a phone in the field.',
    action: 'Scrub the approach',
    status: 'Panorama · 183 KB · immediate',
  },
  {
    id: 'scrub',
    index: '02',
    label: 'Scrub',
    eyebrow: 'All-keyframe motion',
    title: 'Move through the wall at your pace.',
    body: 'Scroll or drag the timeline to choose the exact frame. The motion file is requested only when this view opens.',
    action: 'Reveal the topo',
    status: '40 second scrub · 17.7 MB · on demand',
  },
  {
    id: 'topo',
    index: '03',
    label: 'Topo',
    eyebrow: 'Provisional route reference',
    title: 'Photography becomes a field layer.',
    body: 'Crossfade between spatial relief and the registered topo. Route geometry stays provisional until it is checked at the wall.',
    action: 'Open the 3D wall',
    status: 'Registered preview · field verification required',
  },
  {
    id: 'model',
    index: '04',
    label: '3D',
    eyebrow: 'Nasenwand · real scan',
    title: 'Turn the same wall in your hands.',
    body: 'The real 5.2-million-triangle capture is reduced to a browser-ready 1.66 MB wall and loaded only after you ask for it.',
    action: 'Review the media budget',
    status: '208k triangles · 1.66 MB · on demand',
  },
];

const photographs = [
  ['/photography/gallery/vm-6578-ost-face.webp', 'Ost face · rain the day before', 'Helenental'],
  ['/photography/gallery/vm-6537-two-on-the-wall.webp', 'Two on the wall', 'Archive'],
  ['/photography/gallery/vm-6918-full-extension.webp', 'Full extension', '6c'],
  ['/photography/gallery/vm-6242-portrait-after-the-send.webp', 'After the send', 'Portrait'],
  ['/photography/gallery/vm-6693-high-on-the-pillar.webp', 'High on the pillar', 'Peilstein'],
  ['/photography/gallery/vm-7303-belay-talk.webp', 'Belay talk', 'Peilstein'],
] as const;

const timeLabel = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00';
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
};

export default function WallRevealExperience() {
  const [active, setActive] = useState<StageId>('place');
  const [panel, setPanel] = useState<PanelId>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [topoMix, setTopoMix] = useState(72);
  const [viewerState, setViewerState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [shareState, setShareState] = useState('Share');
  const videoRef = useRef<HTMLVideoElement>(null);
  const gestureRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const activeIndex = stages.findIndex((stage) => stage.id === active);
  const stage = stages[activeIndex];
  const progress = useMemo(() => (duration ? Math.min(100, (currentTime / duration) * 100) : 0), [currentTime, duration]);

  useEffect(() => {
    if (active !== 'model' || viewerState !== 'idle') return;
    setViewerState('loading');
    ensureModelViewer()
      .then(() => setViewerState('ready'))
      .catch(() => setViewerState('error'));
  }, [active, viewerState]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanel(null);
      if (panel) return;
      if (event.key === 'ArrowRight') setActive(stages[Math.min(stages.length - 1, activeIndex + 1)].id);
      if (event.key === 'ArrowLeft') setActive(stages[Math.max(0, activeIndex - 1)].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, panel]);

  const selectStage = (id: StageId) => {
    videoRef.current?.pause();
    setPlaying(false);
    setActive(id);
    setPanel(null);
  };

  const scrubTo = (percentage: number) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const next = (Math.max(0, Math.min(100, percentage)) / 100) * duration;
    video.currentTime = next;
    setCurrentTime(next);
  };

  const toggleVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    else {
      video.pause();
      setPlaying(false);
    }
  };

  const advance = () => {
    if (active === 'model') setPanel('budget');
    else selectStage(stages[activeIndex + 1].id);
  };

  const share = async () => {
    const url = window.location.href;
    const canShare = typeof navigator.share === 'function';
    try {
      if (canShare) await navigator.share({ title: 'Vertical Moment — Wall Reveal', text: 'One wall, from place to route to 3D.', url });
      else await navigator.clipboard.writeText(url);
      setShareState(canShare ? 'Shared' : 'Link copied');
    } catch {
      setShareState('Share');
    }
    window.setTimeout(() => setShareState('Share'), 2200);
  };

  const panelTitle = panel === 'gallery'
    ? 'Selected photography'
    : panel === 'panoramas'
      ? 'Wachau panorama references'
      : panel === 'budget'
        ? 'Media delivery plan'
        : 'Wall Reveal';

  return (
    <main
      className={styles.reveal}
      onWheel={(event) => {
        if (active !== 'scrub') return;
        event.preventDefault();
        scrubTo(progress + event.deltaY * 0.045);
      }}
      onPointerDown={(event) => {
        if ((event.target as Element).closest('button, input, a, model-viewer')) return;
        gestureRef.current = { x: event.clientX, y: event.clientY, time: currentTime };
      }}
      onPointerMove={(event) => {
        const start = gestureRef.current;
        if (!start || active !== 'scrub' || !duration) return;
        const verticalDelta = start.y - event.clientY;
        if (Math.abs(verticalDelta) > 8) scrubTo(((start.time + verticalDelta * 0.04) / duration) * 100);
      }}
      onPointerUp={(event) => {
        const start = gestureRef.current;
        gestureRef.current = null;
        if (!start || active === 'scrub') return;
        const distance = event.clientX - start.x;
        if (Math.abs(distance) < 70) return;
        selectStage(stages[Math.max(0, Math.min(stages.length - 1, activeIndex + (distance < 0 ? 1 : -1)))].id);
      }}
    >
      <div className={styles.media} aria-hidden={active === 'model' ? undefined : true}>
        {active === 'place' && <img src="/photography/nasenwand/nasenwand-photo-1280.webp" alt="" />}
        {active === 'scrub' && (
          <video
            ref={videoRef}
            src="/photography/nasenwand/media/scrub-540-allkey.mp4"
            poster="/photography/nasenwand/nasenwand-photo-1280.webp"
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        )}
        {active === 'topo' && (
          <>
            <img src="/photography/nasenwand/nasenwand-spatial-1280.webp" alt="" />
            <img className={styles.topoLayer} style={{ opacity: topoMix / 100 }} src="/photography/nasenwand/nasenwand-topo-1280.webp" alt="" />
          </>
        )}
        {active === 'model' && (
          <div className={styles.modelSurface}>
            {viewerState === 'ready'
              ? createElement('model-viewer', {
                  class: styles.model,
                  src: '/models/nasenwand-bergsteiger-lod0.glb',
                  poster: '/photography/nasenwand/nasenwand-spatial-1280.webp',
                  alt: 'Interactive photogrammetry model of the Nasenwand climbing wall',
                  'camera-controls': true,
                  'touch-action': 'pan-y',
                  'interaction-prompt': 'auto',
                  'camera-orbit': '118deg 78deg 105%',
                  'shadow-intensity': '0',
                  exposure: '1.05',
                  loading: 'eager',
                })
              : <div className={styles.modelLoading}>{viewerState === 'error' ? '3D unavailable — the spatial still remains visible.' : 'Preparing the real wall…'}</div>}
          </div>
        )}
        <div className={styles.veil} />
        <div className={styles.grain} />
      </div>

      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="Vertical Moment home">
          <span className={`vm-static-logo vm-static-logo--digital ${styles.mark}`} aria-hidden="true" />
          <span>Vertical Moment</span>
        </a>
        <div className={styles.headerActions}>
          <button type="button" onClick={share}>{shareState}</button>
          <button type="button" aria-label="Open Wall Reveal menu" onClick={() => setPanel('menu')}>Menu</button>
        </div>
      </header>

      <div className={styles.visionLabel}>Vision / Wall Reveal</div>

      <section className={styles.story} aria-live="polite">
        <p className={styles.eyebrow}>{stage.index} / {stage.eyebrow}</p>
        <h1>{stage.title}</h1>
        <p className={styles.body}>{stage.body}</p>

        {active === 'place' && (
          <button className={styles.secondaryAction} type="button" onClick={() => setPanel('gallery')}>View selected photography <span>6 / 33</span></button>
        )}

        {active === 'scrub' && (
          <div className={styles.motionControl}>
            <button type="button" onClick={toggleVideo} aria-label={playing ? 'Pause motion' : 'Play motion'}>{playing ? 'Pause' : 'Play'}</button>
            <input aria-label="Scrub through the wall motion" type="range" min="0" max="100" step="0.1" value={progress} onChange={(event) => scrubTo(Number(event.target.value))} />
            <span>{timeLabel(currentTime)} / {timeLabel(duration)}</span>
          </div>
        )}

        {active === 'topo' && (
          <>
            <label className={styles.mixControl}>
              <span>Spatial</span>
              <input aria-label="Blend spatial relief and registered topo" type="range" min="0" max="100" value={topoMix} onChange={(event) => setTopoMix(Number(event.target.value))} />
              <span>Topo</span>
            </label>
            <button className={styles.secondaryAction} type="button" onClick={() => setPanel('panoramas')}>Open regional panoramas <span>9 studies</span></button>
          </>
        )}

        <nav className={styles.stageNav} aria-label="Wall Reveal stages">
          <div className={styles.track}><span style={{ width: `${(activeIndex / (stages.length - 1)) * 100}%` }} /></div>
          {stages.map((item) => (
            <button key={item.id} type="button" className={item.id === active ? styles.activeStage : ''} aria-current={item.id === active ? 'step' : undefined} onClick={() => selectStage(item.id)}>
              <i>{item.index}</i><span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className={styles.primaryAction} type="button" onClick={advance}><span>{stage.action}</span><b aria-hidden="true">Next</b></button>
        <button className={styles.status} type="button" onClick={() => setPanel('budget')}>Media: {stage.status}</button>
      </section>

      <div className={styles.sideNote}>{active === 'scrub' ? 'Scroll to scrub · drag timeline' : active === 'model' ? 'Drag to orbit · pinch to zoom' : 'Swipe or choose a stage'}</div>

      {panel && (
        <div className={styles.panelBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPanel(null); }}>
          <section className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="wall-reveal-panel-title">
            <div className={styles.panelHead}>
              <div><p>Vertical Moment</p><h2 id="wall-reveal-panel-title">{panelTitle}</h2></div>
              <button type="button" aria-label="Close panel" onClick={() => setPanel(null)}>Close</button>
            </div>

            {panel === 'gallery' && (
              <div className={styles.gallery}>
                {photographs.map(([src, title, meta], index) => (
                  <figure key={src}>
                    <span>0{index + 1}</span>
                    <img src={src} alt={`${title}, Vertical Moment climbing photography`} loading={index < 2 ? 'eager' : 'lazy'} />
                    <figcaption><strong>{title}</strong><small>{meta}</small></figcaption>
                  </figure>
                ))}
              </div>
            )}

            {panel === 'panoramas' && (
              <div className={styles.panoramaPanel}>
                <div className={styles.panoramaIntro}>
                  <span>Regional reference · provisional</span>
                  <p>These images orient the wider Wachau landscape. They do not become route records until wall, sector and access geometry are separately registered and checked in the field.</p>
                </div>
                <div className={styles.panoramaShelf}>
                  {panoramas.map((panorama, index) => (
                    <a key={panorama.id} href={`/prints/panoramas#${panorama.id}`}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <img src={panorama.thumbnail} alt={panorama.alt} loading={index < 2 ? 'eager' : 'lazy'} />
                      <strong>{panorama.title}</strong>
                      <small>{panorama.category.replace('-', ' ')} · print study</small>
                    </a>
                  ))}
                </div>
                <a className={styles.panoramaProductLink} href="/prints/panoramas">Open the panorama viewer and print details</a>
              </div>
            )}

            {panel === 'budget' && (
              <div className={styles.budget}>
                <div><span>First view</span><strong>183 KB panorama</strong></div>
                <div><span>Scrub requested</span><strong>17.7 MB all-keyframe video</strong></div>
                <div><span>Topo requested</span><strong>547 KB registered layer</strong></div>
                <div><span>3D requested</span><strong>1.66 MB optimized Nasenwand</strong></div>
                <div><span>Photo preview</span><strong>590 KB · 6 of 33</strong></div>
                <div><span>Panorama shelf</span><strong>1.1 MB thumbnails · proofs on demand</strong></div>
                <p>Print masters, duplicate exports and source scans stay out of the page. The nine panorama masters total 122 MB; the full web set is under 10 MB and only the requested proof is opened.</p>
              </div>
            )}

            {panel === 'menu' && (
              <div className={styles.menu}>
                {stages.map((item) => <button key={item.id} type="button" onClick={() => selectStage(item.id)}><span>{item.index} · {item.label}</span><small>{item.status}</small></button>)}
                <button type="button" onClick={() => setPanel('gallery')}><span>Selected photography</span><small>Six optimized preview frames</small></button>
                <button type="button" onClick={() => setPanel('panoramas')}><span>Wachau panoramas</span><small>Nine regional references and print studies</small></button>
                <button type="button" onClick={() => setPanel('budget')}><span>Media delivery plan</span><small>What loads, when, and why</small></button>
                <a href="/prints/panoramas"><span>Panorama editions</span><small>Full viewer, print limits and inquiry</small></a>
                <a href="/nasenwand-concepts"><span>Nasenwand concept lab</span><small>Compare the wider motion studies</small></a>
                <a href="/"><span>Photography home</span><small>Return to verticalmoment.com</small></a>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
