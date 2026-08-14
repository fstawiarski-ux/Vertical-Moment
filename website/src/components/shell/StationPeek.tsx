import type { ExploreContentBox, JourneyStation } from "../../core/types";
import { STATION_PRESENTATIONS } from "../../core/stationPresentation";
import { ResponsiveImage } from "../media/ResponsiveImage";
import styles from "./StationPeek.module.css";

export function StationPeek({
  station,
  content,
  onOpen,
}: {
  station: JourneyStation;
  content: ExploreContentBox | null;
  onOpen?: (boxId: string) => void;
}) {
  const presentation = STATION_PRESENTATIONS[station];
  const title = content?.title ?? presentation.title;

  return (
    <aside
      className={styles.peek}
      data-station={station}
      aria-live="polite"
      aria-atomic="true"
      aria-label={`${presentation.label} station recommendation`}
    >
      <div className={`${styles.main} ${content?.image ? "" : styles.noMedia}`}>
        {content?.image && (
          <div className={styles.media} aria-hidden="true">
            <ResponsiveImage image={content.image} className={styles.image} />
          </div>
        )}
        <div className={styles.copy}>
          <small>{presentation.label} · recommended view</small>
          <strong>{title}</strong>
          <p>{presentation.description}</p>
        </div>
      </div>
      <div className={styles.footer}>
        <span className={styles.next}>{presentation.nextLabel}</span>
        {content && onOpen && (
          <button type="button" className={styles.open} aria-label={`Open ${title}`} onClick={() => onOpen(presentation.focusBoxId)}>
            Open
          </button>
        )}
      </div>
    </aside>
  );
}
