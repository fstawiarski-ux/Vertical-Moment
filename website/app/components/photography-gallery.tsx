"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "../photography-home.module.css";

type GalleryItem = {
  src: string;
  alt: string;
  label: string;
  title: string;
};

export function PhotographyGallery({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowRight") setActive((active + 1) % items.length);
      if (event.key === "ArrowLeft") setActive((active - 1 + items.length) % items.length);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [active, items.length]);

  return (
    <>
      <div className={styles.galleryGrid}>
        {items.map((item, index) => (
          <button
            className={`${styles.galleryCard} ${styles[`galleryCard${index + 1}`]}`}
            key={item.src}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Open ${item.title}`}
          >
            <Image src={item.src} alt={item.alt} fill sizes="(max-width: 760px) 100vw, 50vw" className={styles.galleryImage} />
            <span className={styles.galleryShade} />
            <span className={styles.galleryMeta}><small>{item.label}</small><strong>{item.title}</strong></span>
            <span className={styles.galleryOpen} aria-hidden="true">+</span>
          </button>
        ))}
      </div>

      {active !== null && (
        <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={items[active].title} onClick={() => setActive(null)}>
          <button className={styles.lightboxClose} type="button" onClick={() => setActive(null)} aria-label="Close image">×</button>
          <button className={`${styles.lightboxArrow} ${styles.lightboxPrev}`} type="button" onClick={(e) => { e.stopPropagation(); setActive((active - 1 + items.length) % items.length); }} aria-label="Previous image">←</button>
          <div className={styles.lightboxFigure} onClick={e => e.stopPropagation()}>
            <Image src={items[active].src} alt={items[active].alt} fill sizes="95vw" className={styles.lightboxImage} />
            <div className={styles.lightboxCaption}><span>{items[active].label}</span><strong>{items[active].title}</strong></div>
          </div>
          <button className={`${styles.lightboxArrow} ${styles.lightboxNext}`} type="button" onClick={(e) => { e.stopPropagation(); setActive((active + 1) % items.length); }} aria-label="Next image">→</button>
        </div>
      )}
    </>
  );
}
