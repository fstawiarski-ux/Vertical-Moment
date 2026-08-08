'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../photography-home.module.css';
import type { LayeredScene } from '../data/layered-photos';

interface LayeredProps {
  scene: LayeredScene;
  /** 'background' fills its parent and never reacts to clicks. 'tile' is interactive. */
  variant?: 'background' | 'tile';
  /** Load the first plane eagerly — use for the hero only. */
  priority?: boolean;
}

const SHATTER_MS = 900;
const RESET_MS = 1250;

export default function PhotographyLayered({ scene, variant = 'tile', priority = false }: LayeredProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const shardsRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<number | null>(null);
  /** Shards are only fetched once the pointer arrives — they are dead weight otherwise. */
  const [armed, setArmed] = useState(false);
  const [breaking, setBreaking] = useState(false);

  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Pointer position is published as CSS custom properties; each plane multiplies
  // them by its own motion value, so the whole scene moves on one rAF frame.
  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reduced) return;
      const el = rootRef.current;
      if (!el) return;
      const { clientX, clientY } = e;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', String((clientX - r.left) / r.width - 0.5));
        el.style.setProperty('--my', String((clientY - r.top) / r.height - 0.5));
      });
    },
    [reduced],
  );

  const resetPointer = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    el.style.setProperty('--mx', '0');
    el.style.setProperty('--my', '0');
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // A full-bleed background sits under the hero's veil, tint and grain layers,
  // so it can never receive a pointer event of its own — track the window and
  // resolve the position against our own box instead.
  useEffect(() => {
    if (variant !== 'background' || reduced) return;
    if (!window.matchMedia('(pointer:fine)').matches) return;

    let raf: number | null = null;
    const onMove = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (raf !== null) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        el.style.setProperty('--mx', String((e.clientX - r.left) / r.width - 0.5));
        el.style.setProperty('--my', String((e.clientY - r.top) / r.height - 0.5));
      });
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [reduced, variant]);

  const shatter = useCallback(() => {
    if (reduced || variant === 'background' || breaking) return;
    const host = shardsRef.current;
    if (!host) return;
    setBreaking(true);
    Array.from(host.children).forEach((node, i) => {
      const shard = scene.shards[i];
      if (!shard) return;
      node.animate(
        [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${shard.dx}px, ${shard.dy}px) rotate(${shard.rot}deg)`, opacity: 0 },
        ],
        { duration: SHATTER_MS, delay: i * 20, easing: 'cubic-bezier(.2,.72,.2,1)', fill: 'forwards' },
      );
    });
    window.setTimeout(() => setBreaking(false), RESET_MS);
  }, [breaking, reduced, scene.shards, variant]);

  const interactive = variant === 'tile';

  return (
    <div
      ref={rootRef}
      className={[
        styles.scene,
        variant === 'background' ? styles.sceneBg : styles.sceneTile,
        breaking ? styles.sceneBreaking : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ aspectRatio: variant === 'tile' ? '1080 / 1350' : undefined }}
      onPointerMove={onPointerMove}
      onPointerEnter={() => setArmed(true)}
      onPointerLeave={resetPointer}
      onClick={interactive ? shatter : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `${scene.title} — click for the shard transition` : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                shatter();
              }
            }
          : undefined
      }
    >
      <span className={styles.planes}>
        {scene.layers.map((layer, i) => (
          <img
            key={layer.src}
            className={styles.plane}
            src={layer.src}
            alt={i === 0 ? scene.alt : ''}
            width={scene.width}
            height={scene.height}
            loading={priority && i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            style={
              {
                '--motion': `${layer.motion}px`,
                '--plane-scale': layer.scale,
                zIndex: i + 1,
              } as React.CSSProperties
            }
          />
        ))}
        <span className={styles.shine} aria-hidden="true" />
      </span>

      {interactive && armed && (
        <span className={styles.shards} ref={shardsRef} aria-hidden="true">
          {scene.shards.map((shard) => (
            <img key={shard.src} src={shard.src} alt="" loading="lazy" decoding="async" />
          ))}
        </span>
      )}

      {interactive && (
        <span className={styles.sceneCap}>
          <b>{scene.title}</b>
          <em>{scene.meta}</em>
        </span>
      )}
    </div>
  );
}
