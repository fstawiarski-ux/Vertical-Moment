"use client";

import { useEffect, useState } from "react";
import styles from "./planner.module.css";

export default function PlannerFrame() {
  const [shareUrl, setShareUrl] = useState("https://verticalmoment.com/explore-app/planner");
  const [src, setSrc] = useState("/explore-app/planner-content.html");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setShareUrl(new URL("/explore-app/planner", window.location.origin).href);
    if (window.location.hash) setSrc("/explore-app/planner-content.html" + window.location.hash);
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Link copied. Your saved notes stay on this device.");
    } catch {
      setMessage("Select the address above to copy it.");
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/explore-app" className={styles.back}>← Climbers Lounge</a>
        <label className={styles.share}>
          <span>Share with friends</span>
          <input aria-label="Planner share link" value={shareUrl} readOnly onFocus={(event) => event.currentTarget.select()} />
        </label>
        <button type="button" onClick={copyLink}>Copy link</button>
        <p role="status" className={styles.status}>{message || "Personal entries are saved only in your browser."}</p>
      </header>
      <iframe className={styles.frame} src={src} title="Climbing calendar, photography and climber outreach planner" />
    </main>
  );
}
