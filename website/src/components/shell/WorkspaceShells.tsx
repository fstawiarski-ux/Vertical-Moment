import type { ReactNode } from "react";
import type { BoxState } from "../../core/types";
import styles from "../../ExploreApp.module.css";

export function TabletShell({ visible, renderBox, exclusiveMode }: {
  visible: BoxState[];
  renderBox: (box: BoxState) => ReactNode;
  exclusiveMode: string;
}) {
  return (
    <section className={styles.boxLayer} data-shell="tablet" data-layout="tablet" data-exclusive-mode={exclusiveMode} aria-label="Tablet Explore workspace">
      {visible.map(renderBox)}
    </section>
  );
}

export function DesktopShell({ visible, renderBox, exclusiveMode }: {
  visible: BoxState[];
  renderBox: (box: BoxState) => ReactNode;
  exclusiveMode: string;
}) {
  return (
    <section className={styles.boxLayer} data-shell="desktop" data-layout="desktop" data-exclusive-mode={exclusiveMode} aria-label="Desktop Explore canvas">
      {visible.map(renderBox)}
    </section>
  );
}
