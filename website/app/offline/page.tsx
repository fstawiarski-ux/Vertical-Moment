import type { Metadata } from "next";
import styles from "./offline.module.css";

export const metadata: Metadata = {
  title: "Offline · Explore Lab",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className={styles.page}>
      <span aria-hidden="true" />
      <small>Vertical Moment · Explore Lab</small>
      <h1>You are offline.</h1>
      <p>The app shell and any saved offline pack remain available. Reconnect once to refresh content or download heavy 3D and scrub assets.</p>
      <a href="/explore-app">Try Explore Lab again</a>
    </main>
  );
}
