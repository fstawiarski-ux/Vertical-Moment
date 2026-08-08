'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from '../photography-home.module.css';
import { photographFilters, photographs, type PhotographTag } from '../data/photographs';

type FilterId = 'all' | PhotographTag;

export default function PhotographyGallery() {
  const [filter, setFilter] = useState<FilterId>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const visible = useMemo(
    () => (filter === 'all' ? photographs : photographs.filter((p) => p.tags.includes(filter))),
    [filter],
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

  return (
    <section className={styles.work} id="work">
      <div className={styles.wrap}>
        <div className={styles.sechead}>
          <div>
            <p className={styles.eyebrow}>Portfolio</p>
            <h2>Selected work</h2>
          </div>
          <div className={styles.side}>{visible.length} frames · 2024 — 2026</div>
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

        <div className={styles.gal}>
          {visible.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={styles.shot}
              onClick={() => setOpenIndex(i)}
              aria-label={`Open ${p.title}`}
            >
              <img src={p.src} alt={p.alt} width={p.width} height={p.height} loading="lazy" decoding="async" />
              <span className={styles.sheen} aria-hidden="true" />
              <span className={styles.tick} aria-hidden="true" />
              <span className={styles.tickV} aria-hidden="true" />
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
            {active.title} &nbsp;·&nbsp; <em>{active.meta}</em>
          </div>
        </div>
      )}
    </section>
  );
}
