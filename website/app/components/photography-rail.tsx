'use client';

import { useEffect, useState } from 'react';
import styles from '../photography-home.module.css';

const SECTIONS: { id: string; label: string }[] = [
  { id: 'top', label: 'Home' },
  { id: 'work', label: 'Work' },
  { id: 'approach', label: 'Approach' },
  { id: 'services', label: 'Services' },
  { id: 'about', label: 'About' },
  { id: 'lab', label: '3D Lab' },
  { id: 'contact', label: 'Contact' },
];

export default function PhotographyRail() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState('top');

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const scrollable = document.documentElement.scrollHeight - vh;
      setProgress(scrollable > 0 ? Math.min(100, (y / scrollable) * 100) : 0);
      setVisible(y > vh * 0.85);

      let active = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= vh * 0.42) active = s.id;
      }
      setCurrent(active);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <aside className={`${styles.rail} ${visible ? styles.railShow : ''}`}>
      <span className={styles.railIcon} aria-hidden="true" />
      <span className={styles.railLabel} aria-hidden="true">
        Scroll
      </span>
      <div className={styles.track} aria-hidden="true">
        <i style={{ height: `${progress}%` }} />
      </div>
      <div className={styles.dots}>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={styles.dot}
            aria-label={s.label}
            title={s.label}
            aria-current={s.id === current}
            onClick={() => jump(s.id)}
          />
        ))}
      </div>
    </aside>
  );
}
