'use client';

/* eslint-disable @next/next/no-img-element */

import { createElement, useEffect, useRef, useState } from 'react';
import styles from '../photography-home.module.css';
import { cragModels } from '../data/crag-models';
import { ensureModelViewer } from './model-viewer-loader';

/**
 * The pinned model-viewer dependency is loaded lazily once the section enters
 * the viewport. If it fails, the poster stays put and the section still reads
 * correctly.
 */

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
      setState('loading');
      void ensureModelViewer().then(() => setState('ready')).catch(() => setState('failed'));
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
