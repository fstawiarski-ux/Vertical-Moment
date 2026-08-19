"use client";

import { useMemo, useState } from "react";
import styles from "./BoxWallReveal.module.css";

type StageId = "photo" | "spatial";

const STAGES: Array<{
  id: StageId;
  index: string;
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  status: string;
  src: string;
  alt: string;
}> = [
  {
    id: "photo",
    index: "01",
    label: "Photo",
    eyebrow: "Nasenwand - Wachau",
    title: "One wall. From place to route.",
    body: "Begin with the real place: a light wall photograph that arrives quickly, even on a phone in the field.",
    status: "183 KB - immediate",
    src: "/photography/nasenwand/nasenwand-photo-1280.webp",
    alt: "Drone photograph of the Nasenwand wall",
  },
  {
    id: "spatial",
    index: "02",
    label: "Spatial",
    eyebrow: "Provisional wall study",
    title: "Read the wall before the line.",
    body: "Use the spatial study for orientation. Route facts and geometry stay in their dedicated sector and topo workspaces.",
    status: "844 KB - on demand",
    src: "/photography/nasenwand/nasenwand-spatial-1280.webp",
    alt: "Nasenwand spatial relief study",
  },
];

function focusBox(id: string) {
  window.dispatchEvent(new CustomEvent("vm:focus-box", { detail: { id, mode: "normal" } }));
}

export default function BoxWallReveal() {
  const [active, setActive] = useState<StageId>("photo");
  const [budgetOpen, setBudgetOpen] = useState(false);
  const stage = useMemo(() => STAGES.find((candidate) => candidate.id === active) ?? STAGES[0], [active]);

  return (
    <div className={styles.reveal}>
      <nav className={styles.stageNav} aria-label="Wall study views">
        {STAGES.map((candidate) => (
          <button key={candidate.id} type="button" aria-pressed={candidate.id === active} onClick={() => setActive(candidate.id)}>
            <i>{candidate.index}</i><span>{candidate.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.canvas}>
        <img key={stage.id} className={styles.media} src={stage.src} alt={stage.alt} />
        <div className={styles.veil} aria-hidden="true" />
        <section className={styles.story} aria-live="polite">
          <small>{stage.index} / {stage.eyebrow}</small>
          <h3>{stage.title}</h3>
          <p>{stage.body}</p>
          <div className={styles.storyActions}>
            <button type="button" onClick={() => focusBox("wachau-16")}>Open regional panoramas</button>
            <button type="button" onClick={() => focusBox("nasenwand-spatial")}>Open route workspace</button>
            <button className={styles.deliveryButton} type="button" onClick={() => setBudgetOpen((current) => !current)} aria-expanded={budgetOpen}>Media: {stage.status}</button>
          </div>
        </section>
      </div>

      {budgetOpen && (
        <aside className={styles.budget} aria-label="Wall study media delivery plan">
          <header><small>Delivery plan</small><button type="button" onClick={() => setBudgetOpen(false)}>Close</button></header>
          <dl>
            <div><dt>Wall photo</dt><dd>183 KB immediate</dd></div>
            <div><dt>Spatial study</dt><dd>844 KB on demand</dd></div>
            <div><dt>Topo and model</dt><dd>Dedicated Topo workspace</dd></div>
          </dl>
          <p>Source scans and print masters stay outside the PWA shell. Heavy resources are requested once and reused.</p>
        </aside>
      )}
    </div>
  );
}
