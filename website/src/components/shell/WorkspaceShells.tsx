import type { ReactNode } from "react";
import type { BoxState } from "../../core/types";
import styles from "../../ExploreApp.module.css";

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
