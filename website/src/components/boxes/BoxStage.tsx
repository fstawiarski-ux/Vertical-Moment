"use client";

import type { ReactNode } from "react";
import { useLayoutState } from "../../core/layoutState";
import type { BoxState } from "../../core/types";
import styles from "./BoxStage.module.css";

export function BoxStage({ box, title, eyebrow, children }: {
  box: BoxState;
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  const dispatch = useLayoutState((state) => state.dispatch);

  const focus = () => dispatch({ type: "SET_ACTIVE_BOX", id: box.id });

  return (
    <article
      className={styles.stage}
      data-viewport="mobile"
      data-box-id={box.id}
      data-mode={box.mode}
      data-module-chrome="minimal"
      aria-label={`${title} module`}
      onPointerDown={focus}
      onFocusCapture={focus}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <small>{eyebrow}</small>
          <h2>{title}</h2>
        </div>
      </header>
      <div className={styles.body}>{children}</div>
    </article>
  );
}
