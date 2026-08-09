'use client';

import { useEffect, useRef } from 'react';
import styles from '../photography-home.module.css';

/**
 * Fixed, full-viewport photo collage sitting behind every homepage section
 * that doesn't set its own opaque background (see .bgCollage usage notes in
 * photography-home.module.css). Drifts slowly on its own and leans a few
 * pixels toward the pointer — enough to read as alive without competing
 * with the foreground photography.
 */
export default function PhotographyBackgroundCollage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer:fine)').matches) return;
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      el.style.setProperty('--collage-x', `${x * -10}px`);
      el.style.setProperty('--collage-y', `${y * -8}px`);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return <div className={styles.bgCollage} ref={ref} aria-hidden="true" />;
}
