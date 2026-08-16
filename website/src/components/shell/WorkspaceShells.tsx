import type { ReactNode } from "react";
import type { BoxState } from "../../core/types";
import styles from "../../ExploreApp.module.css";

export function TabletShell({ visible, renderBox, exclusiveMode, unifiedHierarchy = false, journeyActive = false }: {
  visible: BoxState[];
  renderBox: (box: BoxState) => ReactNode;
  exclusiveMode: string;
  unifiedHierarchy?: boolean;
  journeyActive?: boolean;
}) {
  const rows = Math.max(1, Math.ceil(visible.length / 2));
  const gridTemplateRows = visible.length <= 2 ? "360px" : `repeat(${rows}, minmax(130px, 1fr))`;

  return (
    <section className={styles.boxLayer} data-shell="tablet" data-layout="tablet" data-hierarchy={unifiedHierarchy ? "phone-inspired" : "baseline"} data-journey-active={journeyActive ? "true" : "false"} data-exclusive-mode={exclusiveMode} style={{ gridTemplateRows }} aria-label="Tablet Explore workspace">
      {visible.map(renderBox)}
    </section>
  );
}

export function DesktopShell({ visible, renderBox, exclusiveMode, unifiedHierarchy = false, journeyActive = false }: {
  visible: BoxState[];
  renderBox: (box: BoxState) => ReactNode;
  exclusiveMode: string;
  unifiedHierarchy?: boolean;
  journeyActive?: boolean;
}) {
  return (
    <section className={styles.boxLayer} data-shell="desktop" data-layout="desktop" data-hierarchy={unifiedHierarchy ? "phone-inspired" : "baseline"} data-journey-active={journeyActive ? "true" : "false"} data-exclusive-mode={exclusiveMode} aria-label="Desktop Explore canvas">
      {visible.map(renderBox)}
    </section>
  );
}
