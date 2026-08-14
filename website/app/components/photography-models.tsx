'use client';

/* eslint-disable @next/next/no-img-element */

import { createElement, useEffect, useRef, useState } from 'react';
import styles from '../photography-home.module.css';
import { cragModels } from '../data/crag-models';

/**
 * model-viewer is a web component, so it is loaded as a module script rather
 * than an npm dependency — that keeps package.json and the Worker bundle
 * untouched, and the whole 3D stack (~150 KB) is only fetched once the section
 * actually scrolls into view. If the script never arrives, the poster stays put
 * and the section still reads correctly.
 */
const VIEWER_SRC = 'https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
const SCRIPT_ID = 'vm-model-viewer';

type LoadState = 'idle' | 'loading' | 'ready' | 'failed';

export default function PhotographyModels() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [state, setState] = useState<LoadState>('idle');

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof IntersectionObserver === 'undefined') {
      setState('failed');
      return;
    }

    const load = () => {
      if (document.getElementById(SCRIPT_ID)) {
        setState('ready');
        return;
      }
      setState('loading');
      const el = document.createElement('script');
      el.id = SCRIPT_ID;
      el.type = 'module';
      el.src = VIEWER_SRC;
      el.onload = () => setState('ready');
      el.onerror = () => setState('failed');
      document.head.appendChild(el);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            load();
            io.disconnect();
          }
        });
      },
      { rootMargin: '300px' },
    );
    io.observe(host);
    return () => io.disconnect();
  }, []);

  const model = cragModels[active];

  return (
    <div className={styles.models} ref={hostRef}>
      <div className={styles.viewer}>
        {state === 'ready' ? (
          createElement('model-viewer', {
            key: model.id,
            src: model.src,
            poster: model.poster,
            alt: `3D model of ${model.crag} — ${model.name}`,
            'camera-controls': true,
            'touch-action': 'pan-y',
            'auto-rotate': true,
            'rotation-per-second': '12deg',
            'auto-rotate-delay': 1200,
            'shadow-intensity': '0.9',
            'shadow-softness': '0.8',
            exposure: '1.05',
            'environment-image': 'neutral',
            'camera-orbit': model.orbit ?? '25deg 72deg auto',
            'interaction-prompt': 'none',
            'max-camera-orbit': 'auto 95deg auto',
            style: { width: '100%', height: '100%', backgroundColor: 'transparent' },
          })
        ) : (
          <div className={styles.viewerFallback}>
            <img src={model.poster} alt={`${model.crag} — ${model.name}`} loading="lazy" />
            <span className={styles.viewerNote}>
              {state === 'failed' ? '3D viewer unavailable — showing the photograph' : 'Loading the wall…'}
            </span>
          </div>
        )}
        <span className={styles.viewerHint} aria-hidden="true">
          {state === 'ready' ? 'Drag to orbit · scroll to zoom' : ''}
        </span>
      </div>

      <div className={styles.modelPicker} role="group" aria-label="Choose a crag model">
        {cragModels.map((m, i) => (
          <button
            key={m.id}
            type="button"
            className={styles.modelChip}
            aria-pressed={i === active}
            onClick={() => setActive(i)}
          >
            <img src={m.poster} alt="" loading="lazy" />
            <span>
              <b>{m.crag}</b>
              <em>{m.name}</em>
            </span>
            {m.scanned && <i className={styles.scanBadge}>Scan</i>}
          </button>
        ))}
      </div>

      <p className={styles.modelMeta}>
        <span>{model.summary}</span>
        <span className={styles.modelMetaActions}>
          <span className={styles.modelStats}>
          {model.routes} · {model.captured}
          </span>
          {model.panoramaHref ? (
            <a className={styles.modelPanoramaLink} href={model.panoramaHref}>
              Open panorama
            </a>
          ) : (
            <span className={styles.modelPanoramaLink} aria-label="Panorama not available yet">Panorama pending</span>
          )}
        </span>
      </p>
    </div>
  );
}
