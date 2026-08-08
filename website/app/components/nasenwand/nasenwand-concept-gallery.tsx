'use client';

import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  NASENWAND_CONCEPTS,
  type NasenwandConceptId,
  type NasenwandFrameMode,
  type SpatialExperienceConfig,
} from '../../data/nasenwand-concepts';
import styles from './nasenwand-concept-gallery.module.css';

type CssVariables = CSSProperties & Record<`--${string}`, string | number>;

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value));
}

function layerOpacity(progress: number, start: number, end: number) {
  return clamp((progress - start) / (end - start), 0, 1);
}

function conceptClass(id: NasenwandConceptId) {
  if (id === 'split') return styles.split;
  if (id === 'geological') return styles.geological;
  return styles.cinematic;
}

function frameClass(id: NasenwandFrameMode) {
  if (id === 'detail') return styles.detail;
  if (id === 'monochrome') return styles.monochrome;
  return styles.wide;
}

export default function NasenwandConceptGallery({ config }: { config: SpatialExperienceConfig }) {
  const [conceptIndex, setConceptIndex] = useState(0);
  const [frameMode, setFrameMode] = useState<NasenwandFrameMode>('wide');
  const [progress, setProgress] = useState(48);
  const [routeProgress, setRouteProgress] = useState(62);
  const [dragging, setDragging] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const concept = NASENWAND_CONCEPTS[conceptIndex];

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const cinematicSpatial = layerOpacity(progress, 12, 48);
  const cinematicTopo = layerOpacity(progress, 58, 86);
  const variables = useMemo<CssVariables>(
    () => ({
      '--vm-nasen-progress': `${progress}%`,
      '--vm-nasen-route-inset': `${100 - routeProgress}%`,
      '--vm-nasen-edge-a': `${clamp(progress + 8)}%`,
      '--vm-nasen-edge-b': `${clamp(progress - 4)}%`,
      '--vm-nasen-edge-c': `${clamp(progress + 3)}%`,
      '--vm-nasen-edge-d': `${clamp(progress - 8)}%`,
      '--vm-nasen-spatial-opacity': cinematicSpatial,
      '--vm-nasen-topo-opacity': cinematicTopo,
      '--vm-nasen-route-opacity': layerOpacity(progress, 66, 82),
      '--vm-nasen-shift-x': `${pointer.x * 8}px`,
      '--vm-nasen-shift-y': `${pointer.y * 6}px`,
      '--vm-nasen-rotate-x': `${pointer.y * -0.8}deg`,
      '--vm-nasen-rotate-y': `${pointer.x * 1.1}deg`,
    }),
    [cinematicSpatial, cinematicTopo, pointer.x, pointer.y, progress, routeProgress],
  );

  function setProgressFromPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const nextProgress = clamp(((event.clientX - bounds.left) / bounds.width) * 100);
    setProgress(Math.round(nextProgress));
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds) return;
    if (!reducedMotion) {
      setPointer({
        x: clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1),
        y: clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1),
      });
    }
    if (dragging) setProgressFromPointer(event);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    setProgressFromPointer(event);
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function resetPointer() {
    if (!dragging) setPointer({ x: 0, y: 0 });
  }

  const phaseLabel =
    concept.id !== 'cinematic'
      ? concept.id === 'split'
        ? 'Photo / spatial'
        : 'Geological edge'
      : progress < 34
        ? '01 · Source photograph'
        : progress < 68
          ? '02 · Spatial relief'
          : '03 · Route reference';

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="Vertical Moment home">
          <img src="/brand/vm-monogram.svg" alt="" width="38" height="38" />
          <span>Vertical Moment</span>
        </a>
        <a className={styles.returnLink} href="/">
          Back to photography
        </a>
      </header>

      <section className={styles.intro} aria-labelledby="nasenwand-title">
        <div>
          <p className={styles.eyebrow}>{config.statusLabel}</p>
          <h1 id="nasenwand-title">{config.cragName}</h1>
        </div>
        <div className={styles.introCopy}>
          <p>{config.region}</p>
          <p>Three ways to move from the image into the wall.</p>
        </div>
      </section>

      <section className={styles.experience} aria-label={`${config.cragName} spatial concept gallery`}>
        <nav className={styles.conceptNav} aria-label="Spatial concepts">
          {NASENWAND_CONCEPTS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === conceptIndex ? styles.conceptActive : undefined}
              aria-pressed={index === conceptIndex}
              onClick={() => setConceptIndex(index)}
            >
              <span>{item.number}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className={styles.conceptSlider}>
          <label htmlFor="nasenwand-concept-range">Concept {concept.number} / 06</label>
          <input
            id="nasenwand-concept-range"
            type="range"
            min="0"
            max={NASENWAND_CONCEPTS.length - 1}
            step="1"
            value={conceptIndex}
            onChange={(event) => setConceptIndex(Number(event.target.value))}
          />
        </div>

        <div
          ref={stageRef}
          className={`${styles.stage} ${conceptClass(concept.id)} ${frameClass(frameMode)} ${dragging ? styles.dragging : ''}`}
          style={variables}
          data-concept={concept.id}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={resetPointer}
          role="group"
          aria-label={`${concept.name} interactive image. Drag horizontally to adjust the reveal.`}
        >
          <div className={styles.motionPlane}>
            <picture className={styles.photoLayer}>
              <source srcSet={config.photo.srcSet} sizes="(max-width: 900px) 100vw, 92vw" />
              <img
                src={config.photo.src}
                alt={config.photo.alt}
                draggable="false"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </picture>

            <picture className={styles.spatialLayer}>
              <source srcSet={config.spatial.srcSet} sizes="(max-width: 900px) 100vw, 92vw" />
              <img src={config.spatial.src} alt={config.spatial.alt} draggable="false" loading="lazy" decoding="async" />
            </picture>

            <picture className={styles.topoLayer}>
              <source srcSet={config.topo.srcSet} sizes="(max-width: 900px) 100vw, 92vw" />
              <img src={config.topo.src} alt={config.topo.alt} draggable="false" loading="lazy" decoding="async" />
            </picture>

            <picture className={styles.routeLayer} aria-hidden="true">
              <source srcSet={config.routes.srcSet} sizes="(max-width: 900px) 100vw, 92vw" />
              <img src={config.routes.src} alt={config.routes.alt} draggable="false" loading="lazy" decoding="async" />
            </picture>
          </div>

          {concept.id === 'split' ? (
            <div className={styles.splitter} aria-hidden="true">
              <span>Drag</span>
            </div>
          ) : null}

          <div className={styles.stageMeta} aria-live="polite">
            <span>{concept.number}</span>
            <strong>{phaseLabel}</strong>
          </div>
          <div className={styles.dragHint} aria-hidden="true">
            Drag / move
          </div>
        </div>

        <div className={styles.controlDeck}>
          <div className={styles.conceptCopy}>
            <p className={styles.eyebrow}>Selected direction</p>
            <h2>
              {concept.number} {concept.name}
            </h2>
            <p>{concept.instruction}</p>
          </div>

          <fieldset className={styles.frames}>
            <legend>Framing / filter</legend>
            {(['wide', 'detail', 'monochrome'] as NasenwandFrameMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={frameMode === mode}
                onClick={() => setFrameMode(mode)}
              >
                {mode === 'wide' ? 'Wide' : mode === 'detail' ? 'Detail crop' : 'Monochrome'}
              </button>
            ))}
          </fieldset>

          <div className={styles.sliders}>
            <label>
              <span>
                Interaction <output>{progress}%</output>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                aria-label="Interaction progress"
                onChange={(event) => setProgress(Number(event.target.value))}
              />
            </label>
            <label>
              <span>
                Route draw <output>{routeProgress}%</output>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={routeProgress}
                aria-label="Route draw progress"
                onChange={(event) => setRouteProgress(Number(event.target.value))}
                disabled={concept.id !== 'cinematic'}
              />
            </label>
            <p>{concept.id === 'cinematic' ? 'Route draw controls the final reference layer.' : 'Route draw becomes active in 06 Cinematic.'}</p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>{config.statusNote}</p>
        <p>Photo → spatial relief → reviewed route geometry → web-ready 3D</p>
      </footer>
    </main>
  );
}
