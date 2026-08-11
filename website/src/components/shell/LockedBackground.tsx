import type { ExploreImageAsset } from "../../core/types";
import { ResponsiveImage } from "../media/ResponsiveImage";
import styles from "./LockedBackground.module.css";

export function LockedBackground({ image, isPromoted }: { image: ExploreImageAsset; isPromoted: boolean }) {
  return (
    <div className={styles.background} aria-hidden="true">
      <div className={styles.image} key={image.src}>
        <ResponsiveImage image={image} priority />
      </div>
      <div className={`${styles.veil} ${isPromoted ? styles.promoted : ""}`} />
      <div className={styles.grain} />
    </div>
  );
}
