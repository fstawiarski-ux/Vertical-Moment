'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from '../photography-home.module.css';
import { crags, photographFilters, photographs, type Crag, type PhotographTag } from '../data/photographs';
import PhotographyLayered from './photography-layered';
import { featuredScene } from '../data/layered-photos';

type FilterId = 'all' | PhotographTag;
type CragId = 'all' | Crag;

export default function PhotographyGallery() {
  const [filter, setFilter] = useState<FilterId>('all');
  const [crag, setCrag] = useState<CragId>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const visible = useMemo(
    () =>
      photographs.filter(
        (p) => (filter === 'all' || p.tags.includes(filter)) && (crag === 'all' || p.crag === crag),
      ),
    [filter, crag],
  );

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((prev) => {
        if (prev === null) return prev;
        const next = (prev + delta + visible.length) % visible.length;
        return next;
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
          <div className={styles.side}>
            {visible.length} frames · {crag === 'all' ? '6 crags' : crag}
          </div>
        </div>

        <div className={styles.chips} role="group" aria-label="Filter photographs">
          {photographFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              className={styles.chip}
              aria-pressed={filter === f.id}
              onClick={() => {
                setFilter(f.id);
                setOpenIndex(null);
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className={styles.filterRow} role="group" aria-label="Filter by crag">
          <span className={styles.filterLabel}>Crag</span>
          <button
            type="button"
            className={styles.chipSm}
            aria-pressed={crag === 'all'}
            onClick={() => {
              setCrag('all');
              setOpenIndex(null);
            }}
          >
            Everywhere
          </button>
          {crags.map((c) => (
            <button
              key={c}
              type="button"
              className={styles.chipSm}
              aria-pressed={crag === c}
              onClick={() => {
                setCrag(c);
                setOpenIndex(null);
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <p className={styles.galNote}>
          Every frame is filed against the crag it was shot at — the same crag, wall and route records that sit in the
          Collective database. Filter by location to see what a sector actually looks like before booking a session there.
        </p>

        <div className={styles.gal}>
          {crag === 'all' && (filter === 'all' || filter === 'detail' || filter === 'people') && (
            <figure className={styles.featured}>
              <div className={styles.featuredFrame}>
                <PhotographyLayered scene={featuredScene} variant="tile" />
              </div>
              <figcaption>Three depth planes from one frame — move the pointer, then click.</figcaption>
            </figure>
          )}
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

        {visible.length === 0 && (
          <p className={styles.galEmpty}>Nothing in the archive matches that combination yet.</p>
        )}

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
            {active.title} &nbsp;·&nbsp; <em>{active.meta}</em>
          </div>
        </div>
      )}
    </section>
  );
}
