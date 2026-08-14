import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Climbers Lounge — Coming Soon",
  description: "The Vertical Moment Climbers Lounge is being prepared as a private field lab before its public release.",
  alternates: { canonical: "/climbers-lounge" },
  openGraph: {
    title: "Climbers Lounge — Coming Soon",
    description: "A new climbing workspace from Vertical Moment is being prepared in private.",
    url: "/climbers-lounge",
    type: "website",
    siteName: "Vertical Moment",
    images: ["/photography/banners/og-1200x630-sample.webp"],
  },
};

export default function ClimbersLoungeComingSoonPage() {
  return (
    <main className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="Vertical Moment photography home">
          <span className={styles.mark} aria-hidden="true" />
          <span>Vertical Moment</span>
        </a>
        <a className={styles.backLink} href="/">
          Photography home
        </a>
      </header>

      <section className={styles.content} aria-labelledby="lounge-title">
        <p className={styles.eyebrow}>Private field lab · In development</p>
        <h1 id="lounge-title">Climbers<br />Lounge</h1>
        <div className={styles.rule} aria-hidden="true" />
        <p className={styles.lead}>
          Route knowledge, panoramas, wall studies and climbing photography are coming together in one offline-ready
          workspace.
        </p>
        <div className={styles.status}>
          <span className={styles.statusDot} aria-hidden="true" />
          <span>Coming soon</span>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>Built in Vienna</span>
        <span>Vertical Moment · 2026</span>
      </footer>
    </main>
  );
}
