'use client';

import { useEffect, useState } from 'react';
import styles from '../photography-home.module.css';

const LINKS: { href: string; label: string }[] = [
  { href: '#work', label: 'Work' },
  { href: '#approach', label: 'Approach' },
  { href: '#services', label: 'Services' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
];

export default function PhotographyNav() {
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

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

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    const t = next ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    try {
      window.localStorage.setItem('vm-theme', t);
    } catch {
      /* storage unavailable — theme still applies for this visit */
    }
  }

  return (
    <>
      <header className={`${styles.nav} ${solid ? styles.navSolid : ''}`}>
        <div className={styles.wrap}>
          <a className={styles.brand} href="#top">
            <span className={styles.mk} aria-hidden="true" />
            <span className={styles.bt}>VERTICAL MOMENT</span>
          </a>
          <div className={styles.navLinks}>
            {LINKS.map((l) => (
              <a key={l.href} className={styles.lnk} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
          <a className={styles.pill} href="/explore">
            Climbers Lounge
          </a>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={`Current theme: ${dark ? 'dark' : 'light'}. Switch to ${dark ? 'light' : 'dark'} mode`}
            aria-pressed={dark}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className={styles.themeGlyph} aria-hidden="true">
              {dark ? 'D' : 'L'}
            </span>
            <span className={styles.themeLabel}>{dark ? 'Dark' : 'Light'}</span>
          </button>
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
              Climbers Lounge
            </a>
            <button
              type="button"
              className={styles.sheetTheme}
              onClick={() => {
                toggleTheme();
                setMenuOpen(false);
              }}
            >
              Theme: {dark ? 'Dark' : 'Light'} · Switch to {dark ? 'light' : 'dark'}
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
