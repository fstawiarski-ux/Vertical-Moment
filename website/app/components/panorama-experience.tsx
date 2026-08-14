'use client';

/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import type { PanoramaExperienceModel, SectorViewId } from '../data/panorama-experiences';
import { ensureModelViewer } from './model-viewer-loader';
import styles from './panorama-experience.module.css';

interface PanoramaExperienceProps {
  experience: PanoramaExperienceModel;
  backHref: string;
  routeFocus?: string;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  startPan: number;
}

interface GalleryDragState {
  pointerId: number;
  startX: number;
  startScroll: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const SECTOR_VIEWS: Array<{ id: SectorViewId; label: string }> = [
  { id: 'photo', label: 'Photo' },
  { id: 'spatial', label: 'Spatial' },
  { id: 'topo', label: 'Topo' },
  { id: 'routes', label: 'Routes' },
  { id: 'model', label: '3D wall' },
];

export default function PanoramaExperience({ experience, backHref, routeFocus }: PanoramaExperienceProps) {
  const [chapterIndex, setChapterIndex] = useState(routeFocus ? 2 : 0);
  const [panX, setPanX] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(true);
  const [galleryPreviewId, setGalleryPreviewId] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [sectorView, setSectorView] = useState<SectorViewId>('photo');
  const [modelState, setModelState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [videoOptionId, setVideoOptionId] = useState(experience.videoOptions?.[0]?.id ?? 'overview');
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const stageRef = useRef<HTMLElement>(null);
  const galleryCanvasRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const galleryDragRef = useRef<GalleryDragState | null>(null);

  const chapter = experience.chapters[chapterIndex];
  const hero = useMemo(
    () => experience.gallery.find((panorama) => panorama.id === experience.heroPanoramaId) ?? experience.gallery[0],
    [experience.gallery, experience.heroPanoramaId],
  );
  const cragThumbMedia = useMemo(
    () => experience.media.find((media) => media.id === experience.cragPanoramaId) ?? hero,
    [experience.cragPanoramaId, experience.media, hero],
  );
  const sectorMediaId = experience.sectorToolkit
    ? sectorView === 'photo'
      ? experience.sectorToolkit.photoId
      : sectorView === 'spatial'
        ? experience.sectorToolkit.spatialId
        : sectorView === 'topo'
          ? experience.sectorToolkit.topoId
          : sectorView === 'routes'
            ? experience.sectorToolkit.photoId
            : experience.sectorToolkit.modelPosterId
    : chapter.mediaPanoramaId;
  const mainMedia = useMemo(() => {
    const mediaId = chapter.id === 'sector' ? sectorMediaId : chapter.mediaPanoramaId;
    return experience.media.find((media) => media.id === mediaId) ?? hero;
  }, [chapter.id, chapter.mediaPanoramaId, experience.media, hero, sectorMediaId]);
  const routeOverlay = useMemo(
    () => experience.media.find((media) => media.id === experience.sectorToolkit?.routesId),
    [experience.media, experience.sectorToolkit?.routesId],
  );
  const videoOption = experience.videoOptions?.find((item) => item.id === videoOptionId)
    ?? experience.videoOptions?.[0];
  const galleryPreview = useMemo(
    () => experience.gallery.find((panorama) => panorama.id === galleryPreviewId) ?? null,
    [experience.gallery, galleryPreviewId],
  );
  const secondaryGallery = useMemo(() => {
    const primaryMediaIds = new Set(
      experience.chapters
        .filter((item) => item.kind === 'panorama')
        .map((item) => item.mediaPanoramaId),
    );
    return experience.gallery.filter((panorama) => !primaryMediaIds.has(panorama.id));
  }, [experience.chapters, experience.gallery]);
  const modelActive = chapter.id === 'sector' && sectorView === 'model' && Boolean(experience.sectorToolkit);
  const isPanoramaChapter = chapter.kind === 'panorama' && !modelActive;
  const imageAspect = imageSize.height > 0
    ? imageSize.width / imageSize.height
    : mainMedia ? mainMedia.displayWidth / mainMedia.displayHeight : 1;
  const renderedImageWidth = stageSize.height * imageAspect;
  const maxPan = isPanoramaChapter ? Math.max(0, (renderedImageWidth - stageSize.width) / 2) : 0;
  const panProgress = maxPan > 0 ? ((maxPan - panX) / (maxPan * 2)) * 100 : 50;
  const overviewWidth = renderedImageWidth > 0 ? clamp((stageSize.width / renderedImageWidth) * 100, 5, 100) : 100;
  const overviewLeft = renderedImageWidth > 0
    ? clamp(((maxPan - panX) / renderedImageWidth) * 100, 0, 100 - overviewWidth)
    : 0;
  const headlineParts = chapter.headline.split(' to ');
  const chapterProgress = experience.chapters.length > 1
    ? `${(chapterIndex / (experience.chapters.length - 1)) * 100}%`
    : '100%';

  useEffect(() => {
    if (window.matchMedia('(max-width: 860px)').matches) setGalleryOpen(false);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () => {
      const bounds = stage.getBoundingClientRect();
      setStageSize({ width: bounds.width, height: bounds.height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setPanX(0);
    if (mainMedia) setImageSize({ width: mainMedia.displayWidth, height: mainMedia.displayHeight });
  }, [chapter.id, mainMedia]);

  useEffect(() => {
    setPanX((current) => clamp(current, -maxPan, maxPan));
  }, [maxPan]);

  useEffect(() => {
    if (!galleryPreview) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setGalleryPreviewId(null);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [galleryPreview]);

  useEffect(() => {
    if (!modelActive || modelState !== 'idle') return;
    setModelState('loading');
    ensureModelViewer()
      .then(() => setModelState('ready'))
      .catch(() => setModelState('error'));
  }, [modelActive, modelState]);

  useEffect(() => {
    setVideoProgress(0);
    setVideoDuration(0);
  }, [videoOptionId]);

  const chooseChapter = (next: number) => {
    setChapterIndex(clamp(next, 0, experience.chapters.length - 1));
    setPanX(0);
    stageRef.current?.focus({ preventScroll: true });
  };

  const setPanFromRange = (value: number) => {
    if (maxPan <= 0) return;
    setPanX(maxPan - (value / 100) * maxPan * 2);
  };

  const seekVideo = (value: number) => {
    const progress = clamp(value, 0, 100);
    setVideoProgress(progress);
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    video.currentTime = (video.duration * progress) / 100;
  };

  const onVideoWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (videoOption?.kind !== 'scrub') return;
    event.preventDefault();
    seekVideo(videoProgress + event.deltaY * 0.045);
  };

  const onOverviewPick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const value = clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100);
    setPanFromRange(value);
  };

  const onWheel = (event: React.WheelEvent<HTMLElement>) => {
    if (!isPanoramaChapter || maxPan <= 0) return;
    event.preventDefault();
    const travel = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    setPanX((current) => clamp(current - travel * 1.35, -maxPan, maxPan));
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const panStep = Math.max(160, stageSize.width * 0.42);
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setPanX((current) => clamp(current - panStep, -maxPan, maxPan));
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setPanX((current) => clamp(current + panStep, -maxPan, maxPan));
    }
    if (event.key === 'ArrowDown' || event.key === '+') {
      event.preventDefault();
      chooseChapter(chapterIndex + 1);
    }
    if (event.key === 'ArrowUp' || event.key === '-') {
      event.preventDefault();
      chooseChapter(chapterIndex - 1);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setPanX(maxPan);
    }
    if (event.key === 'End') {
      event.preventDefault();
      setPanX(-maxPan);
    }
  };

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (!isPanoramaChapter) return;
    const target = event.target as HTMLElement;
    if (target.closest('a, button, input')) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPan: panX,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPanX(clamp(drag.startPan + event.clientX - drag.startX, -maxPan, maxPan));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const horizontalTravel = event.clientX - drag.startX;
    const verticalTravel = event.clientY - drag.startY;
    if (Math.abs(verticalTravel) > 72 && Math.abs(horizontalTravel) < 42) {
      chooseChapter(chapterIndex + (verticalTravel < 0 ? 1 : -1));
    }
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onGalleryWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.scrollLeft += Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  };

  const onGalleryPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    galleryDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: event.currentTarget.scrollLeft,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onGalleryPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = galleryDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.currentTarget.scrollLeft = drag.startScroll - (event.clientX - drag.startX);
  };

  const onGalleryPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = galleryDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    galleryDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const centerGalleryPreview = () => {
    const canvas = galleryCanvasRef.current;
    if (canvas) canvas.scrollLeft = Math.max(0, (canvas.scrollWidth - canvas.clientWidth) / 2);
  };

  return (
    <main className={`${styles.page} ${galleryOpen ? styles.galleryActive : ''}`}>
      <div className={styles.shell}>
        <aside className={styles.contextRail} aria-label={`${experience.crag} context`}>
          <Link className={styles.brand} href="/" aria-label="Vertical Moment home">
            <span className={`vm-static-logo ${styles.brandLogo}`} aria-hidden="true" />
            <span>Vertical<br />Moment</span>
          </Link>

          <p className={styles.contextEyebrow}>Explore / {experience.region}</p>

          <section className={styles.cragCard} aria-labelledby="panorama-crag-title">
            {cragThumbMedia ? (
              <img className={styles.cragThumb} src={cragThumbMedia.thumbnail} alt="" width={320} height={180} loading="eager" />
            ) : (
              <img className={styles.cragThumb} src="/photography/lab/lab-texture.webp" alt="" width={320} height={180} loading="eager" />
            )}
            <h1 id="panorama-crag-title">{experience.crag}</h1>
            <p>{experience.region} · {experience.routeSummary}</p>
            {routeFocus && <p className={styles.routeFocus}>Route context · {routeFocus}</p>}
            <nav className={styles.cragTabs} aria-label={`${experience.crag} sections`}>
              <Link href={backHref}>Routes</Link>
              <Link href="/vision/wall-reveal">3D Lab</Link>
              <span aria-current="page">Panorama</span>
            </nav>
          </section>

          {experience.referenceLinks?.length ? (
            <nav className={styles.referenceRail} aria-label={`${experience.crag} external references`}>
              <p>Topo & field references</p>
              {experience.referenceLinks.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                  <span>{link.label}</span>
                  <small>{link.meta}</small>
                </a>
              ))}
            </nav>
          ) : null}

          <section className={styles.regionGallery} aria-labelledby="region-gallery-title">
            <button
              className={styles.galleryToggle}
              type="button"
              aria-expanded={galleryOpen}
              aria-controls="region-panorama-grid"
              onClick={() => setGalleryOpen((open) => !open)}
            >
              <span id="region-gallery-title">{experience.region} gallery</span>
              <small>{secondaryGallery.length} views</small>
            </button>
            <div id="region-panorama-grid" className={styles.regionGrid} hidden={!galleryOpen}>
              {secondaryGallery.map((panorama, index) => (
                <button
                  key={panorama.id}
                  type="button"
                  className={styles.galleryItem}
                  aria-label={`Preview ${panorama.title} without chapter controls`}
                  onClick={() => setGalleryPreviewId(panorama.id)}
                >
                  <img src={panorama.thumbnail} alt="" width={160} height={100} loading={index < 3 ? 'eager' : 'lazy'} decoding="async" />
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </button>
              ))}
              {!secondaryGallery.length && (
                <p className={styles.emptyGallery}>No additional regional panoramas have been uploaded yet.</p>
              )}
            </div>
          </section>
        </aside>

        <section
          ref={stageRef}
          className={styles.stage}
          aria-label={`Interactive panorama of ${experience.crag}`}
          aria-describedby="panorama-instructions"
          tabIndex={0}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {modelActive && experience.sectorToolkit ? (
            <div className={styles.modelSurface}>
              {modelState === 'ready'
                ? createElement('model-viewer', {
                    src: experience.sectorToolkit.modelSrc,
                    poster: mainMedia?.src,
                    alt: `Interactive photogrammetry model of ${experience.crag}`,
                    'camera-controls': true,
                    'touch-action': 'pan-y',
                    'interaction-prompt': 'auto',
                    'camera-orbit': '118deg 78deg 105%',
                    'shadow-intensity': '0',
                    exposure: '1.05',
                    loading: 'eager',
                  })
                : mainMedia ? (
                  <>
                    <img src={mainMedia.src} alt={mainMedia.alt} />
                    <span>{modelState === 'error' ? '3D unavailable · spatial study remains visible' : 'Preparing the 1.75 MB wall…'}</span>
                  </>
                ) : null}
            </div>
          ) : mainMedia ? (
            <img
              key={`${chapter.id}-${mainMedia.id}`}
              className={styles.stageImage}
              src={mainMedia.src}
              srcSet={'srcSet' in mainMedia ? mainMedia.srcSet : undefined}
              sizes="(max-width: 860px) 100vw, 72vw"
              alt={mainMedia.alt}
              width={mainMedia.displayWidth}
              height={mainMedia.displayHeight}
              fetchPriority={chapterIndex === 0 ? 'high' : 'auto'}
              draggable={false}
              onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
              style={{ transform: `translate3d(calc(-50% + ${panX}px), 0, 0) scale(${chapter.scale})` }}
            />
          ) : (
            <div className={styles.emptyStage}>
              <p className={styles.stageEyebrow}>{experience.region} · panorama collection</p>
              <h2>Ready for the first panorama.</h2>
              <p>This reusable page is connected. Optimized previews can be added when the region is photographed.</p>
            </div>
          )}
          {chapter.id === 'sector' && sectorView === 'routes' && routeOverlay ? (
            <img
              className={styles.stageRouteLayer}
              src={routeOverlay.src}
              srcSet={routeOverlay.srcSet}
              sizes="(max-width: 860px) 100vw, 72vw"
              alt=""
              aria-hidden="true"
              draggable={false}
              style={{ transform: `translate3d(calc(-50% + ${panX}px), 0, 0)` }}
            />
          ) : null}
          <div className={styles.stageShade} aria-hidden="true" />

          <header className={styles.stageHeader}>
            <div>
              <p>{experience.crag} / <strong>Panorama</strong></p>
              <span>Loads media on demand</span>
            </div>
            <nav aria-label="Panorama exit controls">
              <Link href={backHref}>Back to crag</Link>
              <Link href="/">Close</Link>
            </nav>
          </header>

          {mainMedia && isPanoramaChapter && (
            <button
              type="button"
              className={styles.overviewMap}
              aria-label={`Jump within the full ${chapter.label.toLowerCase()} panorama`}
              onClick={onOverviewPick}
              style={{ '--overview-aspect': imageAspect } as React.CSSProperties}
            >
              <img
                src={mainMedia.thumbnail}
                alt=""
                width={mainMedia.displayWidth}
                height={mainMedia.displayHeight}
              />
              <span
                className={styles.overviewWindow}
                aria-hidden="true"
                style={{ left: `${overviewLeft}%`, width: `${overviewWidth}%` }}
              />
              {imageAspect > 2.2 ? <b>Full range · current view {Math.round(panProgress)}%</b> : null}
            </button>
          )}

          {chapter.id === 'sector' && experience.sectorToolkit ? (
            <nav className={styles.sectorTools} aria-label="Nasenwand sector media">
              {SECTOR_VIEWS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={sectorView === item.id}
                  onClick={() => setSectorView(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          ) : null}

          {chapter.id === 'sector' && experience.referenceLinks?.length ? (
            <nav className={styles.referenceDock} aria-label="Open external topo references">
              {experience.referenceLinks.slice(0, 2).map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
              ))}
              <span>Own topo · provisional</span>
            </nav>
          ) : null}

          {isPanoramaChapter && (
            <div className={`${styles.heroCopy} ${chapter.id === 'sector' && experience.sectorToolkit ? styles.sectorHero : ''}`}>
              <p className={styles.stageEyebrow}>{chapter.number} · {chapter.label}</p>
              <h2>
                {headlineParts.length === 2 ? (
                  <>{headlineParts[0]} <em>to</em> {headlineParts[1]}</>
                ) : chapter.headline}
              </h2>
              {(chapter.id === 'crag' || chapter.id === 'sector') && (
                <span className={styles.transitionNote}>Aerial approach · transition preview</span>
              )}
            </div>
          )}

          {mainMedia && (chapter.id === 'region' || chapter.id === 'crag' || (chapter.id === 'sector' && !experience.sectorToolkit)) && (
            <div className={styles.focusFrame} aria-hidden="true">
              <span>{chapter.id === 'sector' ? 'Sector detail' : experience.focusLabel}</span>
            </div>
          )}

          {chapter.kind === 'external-360' && (
            <section className={styles.embedPanel} aria-labelledby="external-360-title">
              <header>
                <div>
                  <p>04 · Public drone sphere · loaded on demand</p>
                  <h3 id="external-360-title">360° Nasenwand approach</h3>
                </div>
                {experience.external360Href ? (
                  <a href={experience.external360Href} target="_blank" rel="noreferrer">Open in Google Maps</a>
                ) : null}
              </header>
              {experience.external360EmbedUrl ? (
                <iframe
                  src={experience.external360EmbedUrl}
                  title={`Google Maps 360-degree drone view near ${experience.crag}`}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <div className={styles.embedFallback}>
                  <p>{chapter.description}</p>
                  <strong>360° view coming soon</strong>
                </div>
              )}
            </section>
          )}

          {chapter.kind === 'videos' && (
            experience.videoOptions?.length && videoOption ? (
              <section className={styles.videoDesk} aria-labelledby="videos-title">
                <header>
                  <div>
                    <p>05 · Crag motion · selected media only</p>
                    <h3 id="videos-title">Nasenwand motion desk</h3>
                  </div>
                  {experience.videosHref ? <Link href={experience.videosHref}>Open full media lab</Link> : null}
                </header>
                <nav aria-label="Choose a Nasenwand video mode">
                  {experience.videoOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={videoOption.id === option.id}
                      onClick={() => setVideoOptionId(option.id)}
                    >
                      <span>{option.label}</span>
                      <small>{option.meta}</small>
                    </button>
                  ))}
                </nav>
                <div
                  className={`${styles.videoCanvas} ${videoOption.orientation === 'portrait' ? styles.videoPortrait : ''}`}
                  onWheel={onVideoWheel}
                >
                  {videoOption.kind === 'image' && videoOption.src ? (
                    <img src={videoOption.src} alt="Aerial preview of the Nasenwand rock face" />
                  ) : (
                    <video
                      key={videoOption.id}
                      ref={videoRef}
                      controls={videoOption.kind === 'video'}
                      muted
                      playsInline
                      preload="metadata"
                      poster={videoOption.poster}
                      onLoadedMetadata={(event) => {
                        const duration = event.currentTarget.duration || 0;
                        setVideoDuration(duration);
                        if (videoOption.kind === 'scrub' && duration) event.currentTarget.currentTime = 0;
                      }}
                      onTimeUpdate={(event) => {
                        if (videoOption.kind === 'scrub' || !event.currentTarget.duration) return;
                        setVideoProgress((event.currentTarget.currentTime / event.currentTarget.duration) * 100);
                      }}
                    >
                      {videoOption.sources?.map((source) => (
                        <source key={source.src} src={source.src} type={source.type} />
                      ))}
                    </video>
                  )}
                  {videoOption.contourOverlay ? (
                    <img className={styles.videoContours} src={videoOption.contourOverlay} alt="" aria-hidden="true" />
                  ) : null}
                  <span className={styles.videoStatus}>{videoOption.meta}</span>
                </div>
                <footer>
                  <p>{videoOption.description}</p>
                  {videoOption.kind === 'scrub' ? (
                    <label>
                      <span>Drag or scroll to scrub</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={videoProgress}
                        aria-label="Scrub through the Nasenwand drone flight"
                        onChange={(event) => seekVideo(Number(event.target.value))}
                      />
                      <output>{Math.round((videoDuration * videoProgress) / 100)}s</output>
                    </label>
                  ) : null}
                </footer>
              </section>
            ) : (
              <section className={styles.onDemandPanel} aria-labelledby="videos-title">
                <p>Video stories · tap to load</p>
                <h3 id="videos-title">Crag films and speed ramps</h3>
                <span>Short approach, wall and sector sequences</span>
                <p>{chapter.description}</p>
                <strong>Video collection coming soon</strong>
              </section>
            )
          )}

          <footer className={styles.stageFooter}>
            <div
              className={styles.progress}
              aria-label="Panorama experience chapters"
              style={{ '--chapter-progress': chapterProgress } as React.CSSProperties}
            >
              {experience.chapters.map((item, index) => (
                <button key={item.id} type="button" aria-pressed={index === chapterIndex} onClick={() => chooseChapter(index)}>
                  <span>{item.number}</span>
                  <b>{item.label}</b>
                </button>
              ))}
            </div>

            {isPanoramaChapter && mainMedia && (
              <div className={styles.panExplorer}>
                <div>
                  <strong>Explore the full panorama</strong>
                  <span id="panorama-instructions">Drag with your finger, use the slider, or scroll here to travel sideways.</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={panProgress}
                  aria-label="Move from the beginning to the end of the panorama"
                  onChange={(event) => setPanFromRange(Number(event.target.value))}
                />
                <button type="button" onClick={() => setPanX(0)}>Center view</button>
              </div>
            )}
            {isPanoramaChapter && (
              <p className={styles.chapterDescription} aria-live="polite">{chapter.description}</p>
            )}
          </footer>
        </section>

        <aside className={styles.chapterRail} aria-label="Panorama chapter navigation">
          <p>Experience</p>
          <div>
            {experience.chapters.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={index === chapterIndex}
                aria-label={`Show ${item.label} view`}
                onClick={() => chooseChapter(index)}
              >
                <span>{item.number}</span>
                <b>{item.label}</b>
              </button>
            ))}
          </div>
          <nav aria-label="Step through panorama chapters">
            <button type="button" disabled={chapterIndex === 0} onClick={() => chooseChapter(chapterIndex - 1)}>Previous</button>
            <button type="button" disabled={chapterIndex === experience.chapters.length - 1} onClick={() => chooseChapter(chapterIndex + 1)}>Next</button>
          </nav>
        </aside>
      </div>

      {galleryPreview && (
        <section className={styles.galleryPreview} role="dialog" aria-modal="true" aria-labelledby="gallery-preview-title">
          <header>
            <div>
              <p>{experience.region} · regional panorama</p>
              <h2 id="gallery-preview-title">{galleryPreview.title}</h2>
            </div>
            <button type="button" onClick={() => setGalleryPreviewId(null)}>Close preview</button>
          </header>
          <div
            ref={galleryCanvasRef}
            className={styles.galleryCanvas}
            tabIndex={0}
            aria-label={`Scrollable full-width preview of ${galleryPreview.title}`}
            onWheel={onGalleryWheel}
            onPointerDown={onGalleryPointerDown}
            onPointerMove={onGalleryPointerMove}
            onPointerUp={onGalleryPointerUp}
            onPointerCancel={onGalleryPointerUp}
          >
            <img
              src={galleryPreview.src}
              alt={galleryPreview.alt}
              width={galleryPreview.displayWidth}
              height={galleryPreview.displayHeight}
              draggable={false}
              onLoad={centerGalleryPreview}
            />
          </div>
          <footer>
            <p>Swipe, drag or scroll sideways to see the whole frame.</p>
            <span>{galleryPreview.description}</span>
          </footer>
        </section>
      )}
    </main>
  );
}
