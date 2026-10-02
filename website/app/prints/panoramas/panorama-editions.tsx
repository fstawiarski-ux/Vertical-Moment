'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from 'react';
import { PanoramaGalleryStrip } from '../../components/PanoramaGalleryStrip';
import { panoramaCategories, panoramas, type PanoramaCategory } from '../../data/panoramas';
import styles from './panorama-editions.module.css';

type CategoryFilter = 'all' | PanoramaCategory;
type ViewMode = 'fit' | 'detail';

const initialId = 'wachau-09';
const pixelFormat = new Intl.NumberFormat('en-US');

export default function PanoramaEditions() {
  const [activeId, setActiveId] = useState(initialId);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('fit');
  const [fullScreen, setFullScreen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  const activeIndex = panoramas.findIndex((panorama) => panorama.id === activeId);
  const active = panoramas[activeIndex] ?? panoramas[0];
  const visible = useMemo(
    () => panoramas.filter((panorama) => filter === 'all' || panorama.category === filter),
    [filter],
  );

  useEffect(() => {
    const requested = window.location.hash.slice(1);
    if (panoramas.some((panorama) => panorama.id === requested)) setActiveId(requested);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullScreen(false);
      if (event.key === 'ArrowLeft') selectRelative(-1);
      if (event.key === 'ArrowRight') selectRelative(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const select = (id: string) => {
    setActiveId(id);
    setViewMode('fit');
    window.history.replaceState(null, '', `#${id}`);
    viewerRef.current?.scrollTo({ left: 0, top: 0 });
  };

  const selectRelative = (delta: number) => {
    const next = (activeIndex + delta + panoramas.length) % panoramas.length;
    select(panoramas[next].id);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="Vertical Moment home">
          <span className={`vm-static-logo vm-static-logo--collective ${styles.brandLogo}`} aria-hidden="true" />
          <span>Vertical Moment</span>
        </a>
        <nav aria-label="Panorama navigation">
          <a href="#collection">Collection</a>
          <a href="#reference">Reference use</a>
          <a href="/climbers-lounge">Climbers Lounge</a>
        </nav>
      </header>

      <section className={styles.hero} aria-labelledby="panorama-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Wachau · high-resolution panorama studies</p>
          <h1 id="panorama-title">The whole wall, kept in the frame.</h1>
          <p>
            Nine aerial landscapes prepared as lightweight web previews and provisional regional references. Full-resolution masters remain offline; print orders are not open.
          </p>
          <div className={styles.heroFacts}>
            <span><b>9</b> panorama studies</span>
            <span><b>Web</b> optimized previews</span>
            <span><b>Field</b> reference status shown</span>
          </div>
        </div>
      </section>

      <section className={styles.viewerSection} aria-label="Interactive panorama viewer">
        <div className={styles.viewerHead}>
          <div>
            <p className={styles.eyebrow}>Panorama {String(activeIndex + 1).padStart(2, '0')} / {panoramas.length}</p>
            <h2>{active.title}</h2>
          </div>
          <div className={styles.viewControls} role="group" aria-label="Panorama view controls">
            <button type="button" aria-pressed={viewMode === 'fit'} onClick={() => setViewMode('fit')}>Fit</button>
            <button type="button" aria-pressed={viewMode === 'detail'} onClick={() => setViewMode('detail')}>Inspect detail</button>
            <button type="button" onClick={() => setFullScreen(true)}>Full screen</button>
          </div>
        </div>

        <div ref={viewerRef} className={`${styles.viewer} ${viewMode === 'detail' ? styles.viewerDetail : ''}`}>
          <img
            key={`${active.id}-${viewMode}`}
            src={active.src}
            alt={active.alt}
            width={active.displayWidth}
            height={active.displayHeight}
            fetchPriority="high"
          />
        </div>

        <div className={styles.viewerToolbar}>
          <button type="button" onClick={() => selectRelative(-1)}>Previous</button>
          <p>{viewMode === 'detail' ? 'Drag sideways to inspect the full web proof.' : active.description}</p>
          <button type="button" onClick={() => selectRelative(1)}>Next</button>
        </div>

        <div className={styles.activeInfo}>
          <div>
            <span className={styles.status}>Provisional regional reference</span>
            <p>{active.referenceNote}</p>
          </div>
          <dl>
            <div><dt>Source</dt><dd>{pixelFormat.format(active.sourceWidth)} × {pixelFormat.format(active.sourceHeight)} px</dd></div>
            <div><dt>Region</dt><dd>{active.location}</dd></div>
            <div><dt>Category</dt><dd>{active.category.replace('-', ' ')}</dd></div>
          </dl>
        </div>
      </section>

      <section className={styles.collection} id="collection">
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>The collection</p>
            <h2>A collection of panorama studies.</h2>
          </div>
          <p>Choose a frame to inspect. Each record carries a note on its current regional reference status.</p>
        </div>

        <div className={styles.filters} role="group" aria-label="Filter panorama collection">
          {panoramaCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={filter === category.id}
              onClick={() => setFilter(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <PanoramaGalleryStrip
          className={styles.grid}
          selectedClassName={styles.selectedCard}
          items={visible}
          selectedId={active.id}
          onSelect={(panorama) => {
            select(panorama.id);
            document.querySelector(`.${styles.viewerSection}`)?.scrollIntoView({ behavior: 'smooth' });
          }}
          ariaLabel="Panorama study collection"
          renderMeta={(panorama) => (
            <span><b>{panorama.title}</b><small>{panorama.category.replace('-', ' ')} · {panorama.location}</small></span>
          )}
        />
      </section>

      <section className={styles.reference} id="reference">
        <div>
          <p className={styles.eyebrow}>Prepared for the platform</p>
          <h2>A panorama can guide orientation without replacing the route record.</h2>
        </div>
        <div className={styles.referenceGrid}>
          <article><span>01</span><h3>Crag page</h3><p>A regional panorama sits above sectors as orientation photography, with a clear provisional label until anchors and access points are checked.</p></article>
          <article><span>02</span><h3>Reference notes</h3><p>Each record keeps its current context and regional verification note alongside the image.</p></article>
          <article><span>03</span><h3>Photo archive</h3><p>Each frame keeps its place and reference status alongside the visual study.</p></article>
        </div>
      </section>

      <footer className={styles.footer}>
        <a href="/">Photography home</a>
        <a href="/climbers-lounge">Climbers Lounge</a>
        <span>© 2026 Vertical Moment · Vienna</span>
      </footer>

      {fullScreen && (
        <div className={styles.fullScreen} role="dialog" aria-modal="true" aria-label={`${active.title} full-screen panorama`}>
          <button type="button" className={styles.fullScreenClose} onClick={() => setFullScreen(false)}>Close</button>
          <div className={styles.fullScreenImage}>
            <img src={active.src} alt={active.alt} width={active.displayWidth} height={active.displayHeight} />
          </div>
          <div className={styles.fullScreenBar}>
            <button type="button" onClick={() => selectRelative(-1)}>Previous</button>
            <span>{active.title} · scroll or drag to inspect</span>
            <button type="button" onClick={() => selectRelative(1)}>Next</button>
          </div>
        </div>
      )}
    </main>
  );
}
