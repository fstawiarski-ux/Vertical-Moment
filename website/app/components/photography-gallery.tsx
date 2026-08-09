'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from '../photography-home.module.css';
import { photographs } from '../data/photographs';
import PhotographyLayered from './photography-layered';
import { featuredScene } from '../data/layered-photos';

// A tight, curated set for the homepage rather than the full archive —
// the standard (non-panorama) shots lead the data file, so this is the
// first five: wall/location, portrait, action, action, detail.
const FEATURED_COUNT = 5;

export default function PhotographyGallery() {
  const visible = useMemo(() => photographs.slice(0, FEATURED_COUNT), []);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((prev) => {
        if (prev === null) return prev;
        return (prev + delta + visible.length) % visible.length;
      });
    },
    [visible.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenIndex(null);
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openIndex, step]);

  const active = openIndex === null ? null : visible[openIndex];

  // Small pointer-driven tilt on each tile — the reason to keep moving the mouse.
  const tilt = (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--tx', String((e.clientX - r.left) / r.width - 0.5));
    el.style.setProperty('--ty', String((e.clientY - r.top) / r.height - 0.5));
  };
  const untilt = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty('--tx', '0');
    e.currentTarget.style.setProperty('--ty', '0');
  };

  return (
    <section className={styles.work} id="work">
      <div className={styles.wrap}>
        <div className={styles.sechead}>
          <div>
            <p className={styles.eyebrow}>Portfolio</p>
            <h2>Selected work</h2>
          </div>
          <div className={styles.side}>{visible.length} frames</div>
        </div>

        <p className={styles.galNote}>
          Every frame is filed against the crag it was shot at — the same crag, wall and route records that sit in
          the Collective database.
        </p>

        <div className={styles.gal}>
          <figure className={styles.featured}>
            <div className={styles.featuredFrame}>
              <PhotographyLayered scene={featuredScene} variant="tile" />
            </div>
            <figcaption>Three depth planes from one frame — move the pointer, then click.</figcaption>
          </figure>
          {visible.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={styles.shot}
              onClick={() => setOpenIndex(i)}
              onPointerMove={tilt}
              onPointerLeave={untilt}
              aria-label={`Open ${p.title}`}
            >
              <img src={p.src} alt={p.alt} width={p.width} height={p.height} loading="lazy" decoding="async" />
              <span className={styles.sheen} aria-hidden="true" />
              <span className={styles.frame} aria-hidden="true" />
              <span className={styles.shotCap}>
                <b>{p.title}</b>
                <em>{p.meta}</em>
              </span>
            </button>
          ))}
        </div>

        <div className={styles.more}>
          <a className={styles.cta} href="#contact">
            Book a session <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>

      {active && (
        <div
          className={styles.lb}
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenIndex(null);
          }}
        >
          <button type="button" className={styles.lbClose} aria-label="Close" onClick={() => setOpenIndex(null)}>
            &#10005;
          </button>
          <button type="button" className={styles.lbPrev} aria-label="Previous photograph" onClick={() => step(-1)}>
            &#8249;
          </button>
          <button type="button" className={styles.lbNext} aria-label="Next photograph" onClick={() => step(1)}>
            &#8250;
          </button>
          <img src={active.src} alt={active.alt} width={active.width} height={active.height} />
          <div className={styles.lbCap}>
            <span>
              {active.title} &nbsp;·&nbsp; <em>{active.meta}</em>
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
