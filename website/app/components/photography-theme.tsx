'use client';

import { useEffect, useState } from 'react';
import styles from '../photography-home.module.css';

export type VmTheme = 'day' | 'night' | 'dark' | 'sunny' | 'colorful';

const THEMES: { id: VmTheme; label: string; swatch: string }[] = [
  { id: 'day', label: 'Day', swatch: styles.swDay },
  { id: 'night', label: 'Night', swatch: styles.swNight },
  { id: 'dark', label: 'Dark', swatch: styles.swDark },
  { id: 'sunny', label: 'Super sunny', swatch: styles.swSunny },
  { id: 'colorful', label: 'Super colourful', swatch: styles.swColorful },
];

const STORAGE_KEY = 'vm-theme';
const DEFAULT_THEME: VmTheme = 'day';

function isTheme(value: string | null): value is VmTheme {
  return value === 'day' || value === 'night' || value === 'dark' || value === 'sunny' || value === 'colorful';
}

export default function PhotographyTheme() {
  const [theme, setTheme] = useState<VmTheme>(DEFAULT_THEME);

  // Restore the last choice on mount.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (isTheme(stored)) setTheme(stored);
  }, []);

  // The attribute lives on <html> so fixed elements and the body background
  // pick it up. It is removed on unmount so other routes are untouched.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-vm-theme', theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable — the theme still applies for this visit */
    }
    return () => {
      root.removeAttribute('data-vm-theme');
    };
  }, [theme]);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div className={styles.themes} role="group" aria-label="Colour mode">
      <span className={styles.themesLabel}>Mode</span>
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`${styles.sw} ${t.swatch}`}
          aria-pressed={t.id === theme}
          aria-label={t.label}
          title={t.label}
          onClick={() => setTheme(t.id)}
        >
          <span />
        </button>
      ))}
      <span className={styles.themeName}>{current.label}</span>
    </div>
  );
}
