'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '../photography-home.module.css';
import PhotographyLayered from './photography-layered';
import { heroScene } from '../data/layered-photos';

export default function PhotographyHero() {
  const layerRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Scroll parallax moves the whole stack; the planes inside handle the pointer.
    const onScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      if (y > vh * 1.3) return;
      if (layerRef.current) {
        layerRef.current.style.transform = `translateY(${y * 0.22}px) scale(${1 + (y / vh) * 0.06})`;
      }
      if (markRef.current) {
        markRef.current.style.transform = `translateY(${y * -0.1}px)`;
      }
    };

    const onMove = (e: MouseEvent) => {
      const hero = heroRef.current;
      const mark = markRef.current;
      if (!hero || !mark) return;
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.width / 2) / r.width;
      const y = (e.clientY - r.height / 2) / r.height;
      mark.style.marginLeft = `${x * -26}px`;
      mark.style.marginTop = `${y * -18}px`;
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const finePointer = window.matchMedia('(pointer:fine)').matches;
    const hero = heroRef.current;
    if (finePointer && hero) hero.addEventListener('mousemove', onMove);

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (hero) hero.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <section
      className={[styles.hero, detailOpen ? styles.heroDetailOpen : ''].filter(Boolean).join(' ')}
      id="top"
      ref={heroRef}
    >
      <div className={styles.heroLayer} ref={layerRef}>
        <PhotographyLayered scene={heroScene} variant="background" priority />
      </div>
      <div className={styles.heroVeil} />
      <div className={styles.heroTint} />
      <div className={styles.heroMark} ref={markRef} aria-hidden="true" />
      <div className={styles.heroGrain} aria-hidden="true" />

      <button
        type="button"
        className={styles.detailFocus}
        aria-pressed={detailOpen}
        aria-label={detailOpen ? 'Return to the full hero photograph' : 'Look closer at the climber\u2019s face and fingers'}
        onClick={() => setDetailOpen((open) => !open)}
      >
        <span className={styles.detailLabel}>{detailOpen ? 'Return to full frame' : 'Look closer'}</span>
        <span className={styles.detailArrow} aria-hidden="true">
          {detailOpen ? '\u2196' : '\u2198'}
        </span>
        <span className={styles.detailFrame} aria-hidden="true" />
      </button>

      <div className={`${styles.heroIn} ${styles.wrap}`}>
        <div className={styles.heroCopy}>
          <p className={`${styles.eyebrow} ${styles.onDeep}`}>
            Vertical Moment — climbing &amp; outdoor photography · Vienna
          </p>
          <h1>
            The second <em>before</em> the move.
          </h1>
          <p className={styles.heroSub}>
            Limestone, low light, and the people who read it. Shot on the crags around Vienna, in the Wachau and across
            the Eastern Alps.
          </p>
          <div className={styles.heroFoot}>
            <a className={styles.cta} href="#work">
              See selected work <span aria-hidden="true">&rarr;</span>
            </a>
            <div className={styles.heroMeta}>
              <span>Est. 2020</span>
              <span>Crag · Expedition · Commercial</span>
              <span>Booking 2026</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
