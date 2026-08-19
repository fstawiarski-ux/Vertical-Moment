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

  const printSubject = encodeURIComponent(`Panorama print inquiry — ${active.title} (${active.id})`);
  const printBody = encodeURIComponent(
    `Hello Filip,\n\nI would like to ask about a print of “${active.title}” (${active.id}).\n\nPreferred width / room:\nPaper or finish preference:\nDelivery country:\n\nThank you.`,
  );

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
          <a href="/vision/wall-reveal">Wall Reveal</a>
          <a className={styles.headerCta} href={`mailto:f.stawiarski@gmail.com?subject=${printSubject}&body=${printBody}`}>
            Ask about a print
          </a>
        </nav>
      </header>

      <section className={styles.hero} aria-labelledby="panorama-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Wachau · high-resolution panorama studies</p>
          <h1 id="panorama-title">The whole wall, kept in the frame.</h1>
          <p>
            Nine aerial landscapes prepared as lightweight web previews, provisional regional references and made-to-order
            print studies. The high-resolution masters remain offline.
          </p>
          <div className={styles.heroFacts}>
            <span><b>9</b> panorama studies</span>
            <span><b>92%</b> smaller web delivery</span>
            <span><b>64 cm</b> widest display proof</span>
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
            <div><dt>Master</dt><dd>{pixelFormat.format(active.sourceWidth)} × {pixelFormat.format(active.sourceHeight)} px</dd></div>
            <div><dt>Recommended print</dt><dd>up to about {active.recommendedPrintWidthCm} cm wide at 300 ppi</dd></div>
            <div><dt>Display proof</dt><dd>up to about {active.maximumDisplayWidthCm} cm wide at 240 ppi</dd></div>
            <div><dt>Print status</dt><dd>{active.printStatus === 'proofing-required' ? 'Final crop and proof required' : 'Inquiry open; proof before production'}</dd></div>
          </dl>
          <a className={styles.printCta} href={`mailto:f.stawiarski@gmail.com?subject=${printSubject}&body=${printBody}`}>
            Request this panorama
          </a>
        </div>
      </section>

      <section className={styles.collection} id="collection">
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>The collection</p>
            <h2>One source, three useful outputs.</h2>
          </div>
          <p>Choose a frame for the viewer. Each record carries its print limits and its reference-verification status.</p>
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
          ariaLabel="Panorama print collection"
          renderMeta={(panorama) => (
            <span><b>{panorama.title}</b><small>{panorama.category.replace('-', ' ')} · {panorama.location}</small></span>
          )}
        />
      </section>

      <section className={styles.reference} id="reference">
        <div>
          <p className={styles.eyebrow}>Prepared for the platform</p>
          <h2>The panorama is a product and a data layer—but never the route record itself.</h2>
        </div>
        <div className={styles.referenceGrid}>
          <article><span>01</span><h3>Crag page</h3><p>A regional panorama sits above sectors as orientation photography, with a clear provisional label until anchors and access points are checked.</p></article>
          <article><span>02</span><h3>Wall Reveal</h3><p>The same record opens beside the topo and 3D model without forcing the full-resolution master into the page.</p></article>
          <article><span>03</span><h3>Print edition</h3><p>Visitors request a size and finish. The chosen master receives a final crop, colour proof and production check before sale.</p></article>
        </div>
      </section>

      <footer className={styles.footer}>
        <a href="/">Photography home</a>
        <a href="/vision/wall-reveal">Wall Reveal</a>
        <a href="mailto:f.stawiarski@gmail.com">f.stawiarski@gmail.com</a>
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
