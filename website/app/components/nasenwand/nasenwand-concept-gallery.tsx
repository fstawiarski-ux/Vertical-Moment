'use client';

import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  NASENWAND_CONCEPTS,
  NASENWAND_MEDIA,
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
  const [mediaIndex, setMediaIndex] = useState(0);
  const [conceptIndex, setConceptIndex] = useState(0);
  const [frameMode, setFrameMode] = useState<NasenwandFrameMode>('wide');
  const [progress, setProgress] = useState(48);
  const [routeProgress, setRouteProgress] = useState(62);
  const [mediaProgress, setMediaProgress] = useState(0);
  const [mediaPlaying, setMediaPlaying] = useState(true);
  const [scrollLinked, setScrollLinked] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [mediaDragging, setMediaDragging] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const mediaStageRef = useRef<HTMLDivElement>(null);
  const mediaRunwayRef = useRef<HTMLDivElement>(null);
  const mediaVideoRef = useRef<HTMLVideoElement>(null);
  const mediaDurationRef = useRef(40.6);
  const concept = NASENWAND_CONCEPTS[conceptIndex];
  const media = NASENWAND_MEDIA[mediaIndex];

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(motionPreference.matches);
    update();
    motionPreference.addEventListener('change', update);
    return () => motionPreference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    setMediaProgress(0);
    setMediaPlaying(media.kind === 'video' && !reducedMotion);
    setPointer({ x: 0, y: 0 });
  }, [media.id, media.kind, reducedMotion]);

  useEffect(() => {
    const video = mediaVideoRef.current;
    if (!video) return;
    if (media.kind === 'scrub') {
      video.pause();
      return;
    }
    if (mediaPlaying) {
      void video.play().catch(() => setMediaPlaying(false));
    } else {
      video.pause();
    }
  }, [media.id, media.kind, mediaPlaying]);

  useEffect(() => {
    if (media.kind !== 'scrub') return;
    const video = mediaVideoRef.current;
    if (!video) return;
    const seek = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : mediaDurationRef.current;
      const nextTime = (duration * mediaProgress) / 100;
      if (Math.abs(video.currentTime - nextTime) > 0.035) video.currentTime = nextTime;
    };
    if (video.readyState >= 1) seek();
    else video.addEventListener('loadedmetadata', seek, { once: true });
    return () => video.removeEventListener('loadedmetadata', seek);
  }, [media.kind, mediaProgress]);

  useEffect(() => {
    if (media.id !== 'scrub' || !scrollLinked || reducedMotion) return;
    let animationFrame = 0;
    const updateFromScroll = () => {
      const runway = mediaRunwayRef.current;
      if (!runway) return;
      const bounds = runway.getBoundingClientRect();
      const scrollableDistance = Math.max(1, bounds.height - window.innerHeight);
      setMediaProgress(clamp((-bounds.top / scrollableDistance) * 100));
    };
    const schedule = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updateFromScroll);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [media.id, reducedMotion, scrollLinked]);

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

  const mediaVariables = useMemo<CssVariables>(
    () => ({
      '--vm-media-progress': `${mediaProgress}%`,
      '--vm-media-contours': layerOpacity(mediaProgress, 46, 88),
    }),
    [mediaProgress],
  );

  function setProgressFromPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setProgress(Math.round(clamp(((event.clientX - bounds.left) / bounds.width) * 100)));
  }

  function setMediaProgressFromPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const bounds = mediaStageRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setMediaProgress(clamp(((event.clientX - bounds.left) / bounds.width) * 100));
  }

  function updatePointer(event: ReactPointerEvent<HTMLDivElement>, target: HTMLDivElement | null) {
    const bounds = target?.getBoundingClientRect();
    if (!bounds || reducedMotion) return;
    setPointer({
      x: clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1),
      y: clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1),
    });
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    updatePointer(event, stageRef.current);
    if (dragging) setProgressFromPointer(event);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    setProgressFromPointer(event);
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleMediaPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    updatePointer(event, mediaStageRef.current);
    if (mediaDragging && media.id === 'scrub') setMediaProgressFromPointer(event);
  }

  function handleMediaPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (media.id !== 'scrub') return;
    setMediaDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    setMediaProgressFromPointer(event);
  }

  function handleMediaPointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    setMediaDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function resetPointer() {
    if (!dragging && !mediaDragging) setPointer({ x: 0, y: 0 });
  }

  function seekMedia(nextProgress: number) {
    const next = clamp(nextProgress);
    setMediaProgress(next);
    const video = mediaVideoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = (video.duration * next) / 100;
  }

  function restartMedia() {
    seekMedia(0);
    if (media.kind === 'video') setMediaPlaying(true);
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

  const mediaHasTimeline = media.kind === 'video' || media.kind === 'scrub' || media.kind === 'depth';
  const mediaTime = ((mediaDurationRef.current * mediaProgress) / 100).toFixed(1);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="Vertical Moment home">
          <span className={`vm-static-logo vm-static-logo--technical ${styles.brandLogo}`} aria-hidden="true" />
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
          <p>One wall. Seven motion studies. Three spatial concepts.</p>
        </div>
      </section>

      <section className={styles.mediaGallery} aria-labelledby="media-gallery-title">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>01 / Flagship media desk</p>
            <h2 id="media-gallery-title">Choose the motion language.</h2>
          </div>
          <p>Only the selected view loads. Film, scrub, loops, portrait, fallback, and depth stay in one coherent gallery.</p>
        </div>

        <nav className={styles.mediaNav} aria-label="Nasenwand media modes">
          {NASENWAND_MEDIA.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === mediaIndex ? styles.mediaActive : undefined}
              aria-pressed={index === mediaIndex}
              onClick={() => setMediaIndex(index)}
            >
              <span>{item.number}</span>
              <strong>{item.shortLabel}</strong>
              <small>{item.kind}</small>
            </button>
          ))}
        </nav>

        <div
          ref={mediaRunwayRef}
          className={media.id === 'scrub' && scrollLinked ? styles.scrubRunway : styles.mediaRunway}
        >
          <div className={styles.mediaSticky}>
            <div
              ref={mediaStageRef}
              className={`${styles.mediaStage} ${frameClass(frameMode)} ${
                media.orientation === 'portrait' ? styles.portraitStage : ''
              } ${mediaDragging ? styles.dragging : ''}`}
              style={mediaVariables}
              onPointerDown={handleMediaPointerDown}
              onPointerMove={handleMediaPointerMove}
              onPointerUp={handleMediaPointerEnd}
              onPointerCancel={handleMediaPointerEnd}
              onPointerLeave={resetPointer}
              role="group"
              aria-label={`${media.name} preview${media.id === 'scrub' ? '. Drag horizontally to scrub.' : ''}`}
              data-testid="nasenwand-media-stage"
            >
              {media.kind === 'video' || media.kind === 'scrub' ? (
                <video
                  key={media.id}
                  ref={mediaVideoRef}
                  className={styles.mediaAsset}
                  poster={config.poster}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={`${media.name} video of Nasenwand`}
                  onLoadedMetadata={(event) => {
                    mediaDurationRef.current = event.currentTarget.duration || 40.6;
                    if (media.kind === 'scrub') seekMedia(mediaProgress);
                  }}
                  onTimeUpdate={(event) => {
                    if (media.kind === 'scrub' || !event.currentTarget.duration) return;
                    setMediaProgress((event.currentTarget.currentTime / event.currentTarget.duration) * 100);
                  }}
                >
                  {media.sources?.map((source) => <source key={source.src} src={source.src} type={source.type} />)}
                </video>
              ) : media.kind === 'image' ? (
                <img className={styles.mediaAsset} src={media.src} alt={`${media.name} of the Nasenwand rock face`} />
              ) : (
                <div className={styles.depthStack} aria-label="Five-layer Nasenwand depth study">
                  {config.depthLayers.map((source, index) => {
                    const factor = [0.35, 0.52, 0.7, 0.9, 1.12][index];
                    const zoom = 1.11 - (mediaProgress / 100) * 0.05 * factor;
                    return (
                      <img
                        key={source}
                        src={source}
                        alt=""
                        aria-hidden="true"
                        style={{
                          transform: `translate3d(${pointer.x * 16 * factor}px, ${pointer.y * 12 * factor}px, 0) scale(${zoom})`,
                        }}
                      />
                    );
                  })}
                </div>
              )}

              {media.id === 'scrub' ? (
                <img className={styles.contourLayer} src={config.contours} alt="" aria-hidden="true" />
              ) : null}
              <div className={styles.mediaVeil} aria-hidden="true" />
              <div className={styles.mediaStageTop}>
                <span>Nasenwand / flagship spot</span>
                <span>{media.meta}</span>
              </div>
              <div className={styles.mediaStageBottom} aria-live="polite">
                <div>
                  <span>{media.number}</span>
                  <strong>{media.name}</strong>
                </div>
                <output>{mediaHasTimeline ? `${Math.round(mediaProgress)}% · ${mediaTime}s` : 'Auto loop'}</output>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.mediaControls}>
          <div className={styles.mediaCopy}>
            <p className={styles.eyebrow}>Selected media</p>
            <h3>{media.name}</h3>
            <p>{media.description}</p>
          </div>
          <div className={styles.transport} aria-label="Media transport controls">
            <p>Playback</p>
            <div>
              <button
                type="button"
                onClick={() => setMediaPlaying((current) => !current)}
                disabled={media.kind !== 'video'}
                aria-pressed={media.kind === 'video' ? mediaPlaying : false}
              >
                {mediaPlaying && media.kind === 'video' ? 'Pause' : 'Play'}
              </button>
              <button type="button" onClick={restartMedia} disabled={!mediaHasTimeline}>
                First frame
              </button>
              <button
                type="button"
                onClick={() => setScrollLinked((current) => !current)}
                disabled={media.id !== 'scrub' || reducedMotion}
                aria-pressed={media.id === 'scrub' ? scrollLinked : false}
              >
                Scroll link {media.id === 'scrub' && scrollLinked ? 'on' : 'off'}
              </button>
            </div>
          </div>
          <div className={styles.mediaTimeline}>
            <label>
              <span>
                Media progress <output>{Math.round(mediaProgress)}%</output>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={mediaProgress}
                disabled={!mediaHasTimeline}
                aria-label="Media progress"
                onChange={(event) => seekMedia(Number(event.target.value))}
              />
            </label>
            <p>
              {media.id === 'scrub'
                ? scrollLinked
                  ? 'Scroll through this chapter or drag the stage to control the playhead.'
                  : 'Use the slider or drag the stage to control the playhead.'
                : media.kind === 'image'
                  ? 'Animated image timing is contained in the source asset.'
                  : 'Use playback or scrub the timeline to inspect the cut.'}
            </p>
          </div>
        </div>
      </section>

      <section className={styles.experience} aria-labelledby="concept-lab-title">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>02 / Spatial interaction lab</p>
            <h2 id="concept-lab-title">Move from image into wall.</h2>
          </div>
          <p>The three approved directions retain the original framing, filter, route-draw, pointer, slider, and drag controls.</p>
        </div>

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
          data-testid="nasenwand-concept-stage"
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
            <h3>
              {concept.number} {concept.name}
            </h3>
            <p>{concept.instruction}</p>
          </div>

          <fieldset className={styles.frames}>
            <legend>Framing / filter</legend>
            {(['wide', 'detail', 'monochrome'] as NasenwandFrameMode[]).map((mode) => (
              <button key={mode} type="button" aria-pressed={frameMode === mode} onClick={() => setFrameMode(mode)}>
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
            <p>
              {concept.id === 'cinematic'
                ? 'Route draw controls the final provisional reference layer.'
                : 'Route draw becomes active in 06 Cinematic.'}
            </p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>{config.statusNote}</p>
        <p>Film → scroll → loops → spatial relief → reviewed route geometry → web-ready 3D</p>
      </footer>
    </main>
  );
}
