import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import styles from "./story-page.module.css";
import type { StoryFormat } from "./story-content";

const formats: { id: StoryFormat; label: string; href: string }[] = [
  { id: "climbing", label: "Climbing", href: "/stories/climbing" },
  { id: "product", label: "Product", href: "/stories/product" },
  { id: "events", label: "Events", href: "/stories/events" },
];

export default function StoryChrome({
  current, backdropSrc, children,
}: {
  current: StoryFormat; backdropSrc: string; children: ReactNode;
}) {
  const backdropStyle = { "--preview-backdrop": 'url("' + backdropSrc + '")' } as CSSProperties;
  return (
    <main className={styles.page} style={backdropStyle}>
      <a className={styles.skipLink} href="#story">Skip to the story</a>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/" aria-label="Vertical Moment home">
          <span className={styles.brandMark} aria-hidden="true" />
          <span className={styles.brandCopy}>
            <strong>Vertical Moment</strong>
            <small>Climbing photography / Vienna</small>
          </span>
        </a>
        <nav className={styles.storySwitcher} aria-label="Story formats">
          {formats.map((format) => (
            <Link key={format.id}
              className={styles.switcherLink + (current === format.id ? " " + styles.currentSwitcherLink : "")}
              href={format.href} aria-current={current === format.id ? "page" : undefined}>
              {format.label}
            </Link>
          ))}
        </nav>
        <span className={styles.previewLabel}>STORY FORMAT / CONTENT IN PROGRESS</span>
      </header>
      {children}
    </main>
  );
}

