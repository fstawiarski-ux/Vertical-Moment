'use client';

import { useEffect, useState } from 'react';
import styles from '../photography-home.module.css';

const LINKS: { href: string; label: string }[] = [
  { href: '#work', label: 'Work' },
  { href: '#approach', label: 'Approach' },
  { href: '#services', label: 'Services' },
  { href: '#about', label: 'About' },
  { href: '#lab', label: '3D Lab' },
  { href: '/vision/wall-reveal', label: 'Vision' },
  { href: '#contact', label: 'Contact' },
];

export default function PhotographyNav() {
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <>
      <header className={`${styles.nav} ${solid ? styles.navSolid : ''}`}>
        <div className={styles.wrap}>
          <a className={styles.brand} href="#top">
            <span className={styles.mk} aria-hidden="true" />
            <span className={styles.bt}>VERTICAL MOMENT</span>
          </a>
          {LINKS.map((l) => (
            <a key={l.href} className={styles.lnk} href={l.href}>
              {l.label}
            </a>
          ))}
          <a className={styles.pill} href="/explore">
            Explore climbing
          </a>
          <button type="button" className={styles.burger} onClick={() => setMenuOpen(true)}>
            Menu
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className={styles.sheet}>
          <button type="button" className={styles.sheetClose} onClick={() => setMenuOpen(false)}>
            Close
          </button>
          <nav>
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
                {l.label}
              </a>
            ))}
            <a href="/explore" onClick={() => setMenuOpen(false)}>
              Explore climbing
            </a>
          </nav>
        </div>
      )}
    </>
  );
}
