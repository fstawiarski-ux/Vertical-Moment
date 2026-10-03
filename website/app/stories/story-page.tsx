"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./story-page.module.css";
import type { StoryContent, StoryChapter } from "./story-content";

function MediaSlot({ chapter, compact = false }: { chapter: StoryChapter; compact?: boolean }) {
  return (
    <figure className={styles.mediaSlot + (compact ? " " + styles.compactSlot : "")}>
      <Image className={styles.mediaImage} src={chapter.imageSrc} alt={chapter.imageAlt}
        fill unoptimized sizes="(max-width: 860px) 100vw, 55vw" loading={compact ? "lazy" : "eager"} />
      <span className={styles.photoScrim} aria-hidden="true" />
      <figcaption className={styles.slotTopline}><span>{chapter.mediaLabel}</span><span>SAMPLE FRAME</span></figcaption>
      <div className={styles.slotCaption}><span>{chapter.title}</span><span>Final photo pending</span></div>
    </figure>
  );
}

export default function StoryPage({ story }: { story: StoryContent }) {
  const chapterNodes = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const activeChapter = story.chapters[active] ?? story.chapters[0];

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      const current = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (current) setActive(Number((current.target as HTMLElement).dataset.chapterIndex));
    }, { rootMargin: "-34% 0px -46% 0px", threshold: [0, 0.2, 0.45, 0.7] });
    const nodes = chapterNodes.current.filter((node): node is HTMLElement => node !== null);
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [story]);

  const goToChapter = (index: number) => {
    const node = chapterNodes.current[index];
    if (!node) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
  };

  return (
    <div className={styles.story} id="story">
      <section className={styles.intro} aria-labelledby="story-title">
        <div className={styles.introCopy}>
          <p className={styles.eyebrow}>{story.eyebrow}</p>
          <h1 id="story-title">{story.titleLead}<em>{story.titleAccent}</em></h1>
          <p className={styles.dek}>{story.dek}</p>
          <a className={styles.startLink} href={"#" + story.chapters[0].id}>Enter the story <span aria-hidden="true">v</span></a>
        </div>
        <div className={styles.storyStatus}>
          <span className={styles.statusOverline}>{story.statusLabel}</span>
          <strong>{story.statusTitle}</strong><span>{story.statusNote}</span>
        </div>
      </section>
      <div className={styles.storyHeading}>
        <div><p className={styles.eyebrow}>A scroll-led field note</p><h2>{story.stageTitle}</h2></div>
        <p>{story.stageNote}</p>
      </div>
      <div className={styles.storyGrid}>
        <aside className={styles.desktopStage} aria-label="Current story frame">
          <div className={styles.stageHeader}>
            <span>{story.stageLabel}</span>
            <span>{String(active + 1).padStart(2, "0")} / {String(story.chapters.length).padStart(2, "0")}</span>
          </div>
          <MediaSlot chapter={activeChapter} />
          <div className={styles.stageFooter}>
            <div><span className={styles.stageSmall}>NOW IN FRAME</span><strong>{activeChapter.title}</strong></div>
            <span className={styles.cameraChip}>{activeChapter.pill}</span>
          </div>
          <div className={styles.progressTrack} role="progressbar" aria-label="Story progress"
            aria-valuemin={1} aria-valuemax={story.chapters.length} aria-valuenow={active + 1}>
            <span style={{ width: ((active + 1) / story.chapters.length) * 100 + "%" }} />
          </div>
          <nav className={styles.chapterNav} aria-label="Story chapters">
            {story.chapters.map((chapter, index) => (
              <button type="button" key={chapter.id} onClick={() => goToChapter(index)}
                aria-current={active === index ? "step" : undefined}
                aria-label={"Go to chapter " + (index + 1) + ": " + chapter.title}>
                <span>{String(index + 1).padStart(2, "0")}</span><span>{chapter.title}</span>
              </button>
            ))}
          </nav>
        </aside>
        <div className={styles.chapters}>
          {story.chapters.map((chapter, index) => (
            <section className={styles.chapter + (active === index ? " " + styles.activeChapter : "")}
              id={chapter.id} key={chapter.id} data-chapter-index={index}
              ref={(node) => { chapterNodes.current[index] = node; }}
              aria-labelledby={chapter.id + "-title"}>
              <div className={styles.chapterMeta}><span>{String(index + 1).padStart(2, "0")}</span><span>{chapter.mediaLabel}</span></div>
              <h3 id={chapter.id + "-title"}>{chapter.title}</h3>
              <p className={styles.chapterNote}>{chapter.note}</p><p className={styles.chapterDirection}>{chapter.direction}</p>
              <div className={styles.mobileFrame}><MediaSlot chapter={chapter} compact /></div>
            </section>
          ))}
        </div>
      </div>
      <section className={styles.stillSection} aria-labelledby="detail-title">
        <div className={styles.stillHeading}>
          <div><p className={styles.eyebrow}>{story.detailEyebrow}</p><h2 id="detail-title">{story.detailTitle}</h2></div>
          <p>{story.detailNote}</p>
        </div>
        <div className={styles.stillGrid}>
          {story.selectedFrames.map((chapterIndex, index) => {
            const chapter = story.chapters[chapterIndex];
            return <article className={styles.stillCard} key={chapter.id}>
              <MediaSlot chapter={chapter} compact />
              <div className={styles.stillCardCopy}><span>SAMPLE FRAME / 0{index + 1}</span><h3>{chapter.title}</h3><p>{chapter.note}</p></div>
            </article>;
          })}
        </div>
      </section>
      <footer className={styles.nextSteps}>
        <p className={styles.eyebrow}>CONTENT CURATION</p><h2>{story.checklistTitle}</h2>
        <div className={styles.checklist}>{story.checklist.map((item, index) => (
          <span key={item}><i aria-hidden="true">0{index + 1}</i>{item}</span>
        ))}</div>
        <p className={styles.localOnly}>Story structure preview. Sample images are already published portfolio photographs; final images and story copy will be added after curation.</p>
      </footer>
    </div>
  );
}

