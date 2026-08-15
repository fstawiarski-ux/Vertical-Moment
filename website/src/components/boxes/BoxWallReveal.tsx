"use client";

import { useMemo, useState } from "react";
import styles from "./BoxWallReveal.module.css";

type StageId = "place" | "topo";

const STAGES: Array<{
  id: StageId;
  index: string;
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  status: string;
}> = [
  {
    id: "place",
    index: "01",
    label: "Place",
    eyebrow: "Nasenwand - Wachau",
    title: "One wall. From place to route.",
    body: "Begin with the real place: a light wall photograph that arrives quickly, even on a phone in the field.",
    status: "183 KB - immediate",
  },
  {
    id: "topo",
    index: "02",
    label: "Topo",
    eyebrow: "Provisional route reference",
    title: "Photography becomes a field layer.",
    body: "Crossfade from spatial relief to the registered topo study. Route geometry remains provisional until checked at the wall.",
    status: "844 KB layers - on demand",
  },
];

function focusBox(id: string) {
  window.dispatchEvent(new CustomEvent("vm:focus-box", { detail: { id, mode: "expanded" } }));
}

export default function BoxWallReveal() {
  const [active, setActive] = useState<StageId>("place");
  const [topoMix, setTopoMix] = useState(68);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const stage = useMemo(() => STAGES.find((candidate) => candidate.id === active) ?? STAGES[0], [active]);

  return (
    <div className={styles.reveal}>
      <nav className={styles.stageNav} aria-label="Wall Reveal stages">
        {STAGES.map((candidate) => (
          <button key={candidate.id} type="button" aria-pressed={candidate.id === active} onClick={() => setActive(candidate.id)}>
            <i>{candidate.index}</i><span>{candidate.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.canvas}>
        {active === "place" && (
          <img className={styles.media} src="/photography/nasenwand/nasenwand-photo-1280.webp" alt="Drone photograph of the Nasenwand wall" />
        )}

        {active === "topo" && (
          <div className={styles.topoStage}>
            <img className={styles.media} src="/photography/nasenwand/nasenwand-spatial-1280.webp" alt="Nasenwand spatial relief study" />
            <img
              className={`${styles.media} ${styles.topoLayer}`}
              src="/photography/nasenwand/nasenwand-topo-1280.webp"
              alt="Provisional Nasenwand topo study"
              style={{ opacity: topoMix / 100 }}
            />
            <label className={styles.mixControl}>
              <span>Spatial</span>
              <input aria-label="Blend spatial relief and provisional topo" type="range" min="0" max="100" value={topoMix} onChange={(event) => setTopoMix(Number(event.target.value))} />
              <span>Topo</span>
            </label>
          </div>
        )}

        <div className={styles.veil} aria-hidden="true" />
        <section className={styles.story} aria-live="polite">
          <small>{stage.index} / {stage.eyebrow}</small>
          <h3>{stage.title}</h3>
          <p>{stage.body}</p>
          <div className={styles.storyActions}>
            {active === "place" && <button type="button" onClick={() => focusBox("wachau-16")}>Open regional panoramas</button>}
            {active === "topo" && <button type="button" onClick={() => focusBox("nasenwand-spatial")}>Open route workspace</button>}
             <button className={styles.deliveryButton} type="button" onClick={() => setBudgetOpen((current) => !current)} aria-expanded={budgetOpen}>Media: {stage.status}</button>
          </div>
        </section>
      </div>

      {budgetOpen && (
        <aside className={styles.budget} aria-label="Wall Reveal media delivery plan">
          <header><small>Delivery plan</small><button type="button" onClick={() => setBudgetOpen(false)}>Close</button></header>
          <dl>
            <div><dt>First view</dt><dd>183 KB photo</dd></div>
            <div><dt>Topo comparison</dt><dd>844 KB on demand</dd></div>
            <div><dt>Wachau pack</dt><dd>10.3 MB opt-in</dd></div>
          </dl>
          <p>Source scans and print masters stay outside the PWA shell. Heavy resources are requested once and reused.</p>
        </aside>
      )}
    </div>
  );
}
