"use client";

import { useState } from "react";

export type GalleryPhoto = { src: string; caption: string };

export function PhotoGallery({ photos, showcase = false }: { photos: GalleryPhoto[]; showcase?: boolean }) {
  const [open, setOpen] = useState<GalleryPhoto | null>(null);
  const [selected, setSelected] = useState(photos[0]);
  return (
    <>
      {showcase && selected && (
        <button className="gallery-feature" onClick={() => setOpen(selected)} aria-label={`Open ${selected.caption}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected.src} alt={selected.caption} />
          <span>{selected.caption}</span>
        </button>
      )}
      <div className="gallery-strip">
        {photos.map((p, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <button key={i} className={`gallery-thumb ${showcase && selected?.src === p.src ? "selected" : ""}`} onClick={() => showcase ? setSelected(p) : setOpen(p)} aria-label={p.caption}>
            <img src={p.src} alt={p.caption} loading="lazy" />
          </button>
        ))}
      </div>
      {open && (
        <div className="gallery-lightbox" onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={open.src} alt={open.caption} />
          <div className="gallery-caption">{open.caption}</div>
        </div>
      )}
    </>
  );
}
