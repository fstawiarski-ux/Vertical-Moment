'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from 'react';
import styles from '../photography-home.module.css';

export default function PhotographyHero() {
  const layerRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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
    <section className={styles.hero} id="top" ref={heroRef}>
      <div className={styles.heroLayer} ref={layerRef}>
        <img
          src="/photography/hero/hero-main.webp"
          alt="Climber high on a limestone wall in the last light of the day"
          width={2000}
          height={1153}
          fetchPriority="high"
        />
      </div>
      <div className={styles.heroVeil} />
      <div className={styles.heroTint} />
      <div className={styles.heroMark} ref={markRef} aria-hidden="true" />
      <div className={styles.heroGrain} aria-hidden="true" />

      <div className={`${styles.heroIn} ${styles.wrap}`}>
        <p className={`${styles.eyebrow} ${styles.onDeep}`}>
          Vertical Moment — climbing &amp; outdoor photography · Vienna
        </p>
        <h1>
          The second <em>before</em> the move.
        </h1>
        <p className={styles.heroSub}>
          Limestone, low light, and the people who read it. Shot on the crags around Vienna, in the Wachau and across the
          Eastern Alps.
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
    </section>
  );
}
