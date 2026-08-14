import type { ReactNode } from "react";
import type { Panorama } from "../data/panoramas";

export function PanoramaGalleryStrip({
  items,
  selectedId,
  onSelect,
  ariaLabel,
  className,
  selectedClassName,
  renderMeta,
}: {
  items: Panorama[];
  selectedId: string;
  onSelect: (panorama: Panorama) => void;
  ariaLabel: string;
  className?: string;
  selectedClassName?: string;
  renderMeta?: (panorama: Panorama) => ReactNode;
}) {
  return (
    <div className={className} aria-label={ariaLabel}>
      {items.map((panorama) => (
        <button
          id={panorama.id}
          key={panorama.id}
          type="button"
          className={panorama.id === selectedId ? selectedClassName : undefined}
          aria-pressed={panorama.id === selectedId}
          onClick={() => onSelect(panorama)}
        >
          <img src={panorama.thumbnail} alt="" width={panorama.displayWidth} height={panorama.displayHeight} loading="lazy" draggable={false} />
          {renderMeta ? renderMeta(panorama) : <span>{panorama.title}</span>}
        </button>
      ))}
    </div>
  );
}
