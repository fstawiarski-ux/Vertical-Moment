"use client";

import { useState, type ReactNode } from "react";
import type { BoxState, ExploreContentBox, ExploreContentRegistry } from "../../core/types";
import styles from "../../ExploreApp.module.css";

export function PhoneShell({
  registry,
  boxes,
  activeBoxId,
  stationContent,
  renderBox,
  onOpenBox,
  onSearch,
  onContribute,
  onToggleJourney,
  followJourney,
}: {
  registry: ExploreContentRegistry;
  boxes: BoxState[];
  activeBoxId: string | null;
  stationContent: ExploreContentBox | null;
  renderBox: (box: BoxState) => ReactNode;
  onOpenBox: (id: string) => void;
  onSearch: () => void;
  onContribute: () => void;
  onToggleJourney: () => void;
  followJourney: boolean;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const selected = boxes.find((box) => box.id === activeBoxId && box.mode !== "minimized")
    ?? boxes.find((box) => box.mode !== "minimized")
    ?? boxes[0];
  const selectedContent = selected
    ? registry.boxes.find((content) => content.id === selected.id) ?? stationContent
    : stationContent;
  const primaryIds = ["crag-locator", "nasenwand-spatial", "wachau-16"];
  const primary = primaryIds
    .map((id) => registry.boxes.find((content) => content.id === id))
    .filter((content): content is ExploreContentBox => Boolean(content));
  const additional = registry.boxes.filter((content) => !primaryIds.includes(content.id));

  const openContent = (id: string) => {
    setMoreOpen(false);
    onOpenBox(id);
  };

  return (
    <section className={styles.phoneShell} data-shell="phone" aria-label="Phone Explore workspace">
      <header className={styles.phoneHeader}>
        <div>
          <small>Field workspace</small>
          <strong>{selectedContent?.title ?? "Explore"}</strong>
        </div>
        <button type="button" onClick={onSearch} aria-label="Search the Explore workspace">Search</button>
      </header>
      <p className={styles.phoneHint}>
        {followJourney && stationContent ? `${stationContent.region} · ${stationContent.crag}` : "One focused task at a time"}
      </p>
      <div className={styles.phoneStage}>
        {selected ? renderBox(selected) : <p>Choose a workspace below.</p>}
      </div>
      <nav className={styles.phoneNav} aria-label="Phone workspace navigation">
        <button type="button" aria-pressed={followJourney} onClick={onToggleJourney}>Journey</button>
        {primary.map((content) => (
          <button
            key={content.id}
            type="button"
            aria-current={content.id === selected?.id ? "page" : undefined}
            onClick={() => openContent(content.id)}
          >
            {content.id === "crag-locator" ? "Atlas" : content.id === "nasenwand-spatial" ? "Routes" : "Panorama"}
          </button>
        ))}
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-controls="phone-more-menu"
          onClick={() => setMoreOpen((value) => !value)}
        >
          More
        </button>
      </nav>
      {moreOpen && (
        <div className={styles.phoneMoreMenu} id="phone-more-menu" aria-label="More workspace destinations">
          {additional.map((content) => (
            <button key={content.id} type="button" aria-current={content.id === selected?.id ? "page" : undefined} onClick={() => openContent(content.id)}>
              {content.title}
            </button>
          ))}
          <button type="button" onClick={() => { setMoreOpen(false); onContribute(); }}>Add contribution</button>
        </div>
      )}
    </section>
  );
}
