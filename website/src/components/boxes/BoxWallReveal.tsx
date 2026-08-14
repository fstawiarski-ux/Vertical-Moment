"use client";

import { useMemo, useState } from "react";
import styles from "./BoxWallReveal.module.css";

type StageId = "place" | "gallery" | "topo";

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
    id: "gallery",
    index: "02",
    label: "Gallery",
    eyebrow: "Peilstein - gallery",
    title: "Steep ground, close to the wall.",
    body: "Keep the Peilstein gallery beside the story: a field frame that gives the route context a human scale.",
    status: "Peilstein gallery - immediate",
  },
  {
    id: "topo",
    index: "03",
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

        {active === "gallery" && (
          <div className={styles.sharedStage}>
            <img className={styles.media} src="/photography/gallery/vm-7073-steep-ground.webp" alt="Climber moving through steep Peilstein limestone" />
               <div className={styles.sharedCard}>
                 <small>Peilstein - gallery</small>
                 <strong>Steep Ground</strong>
                 <span>A field frame from the gallery, kept beside the wall story and light enough for the first view.</span>
               </div>
          </div>
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
            {active === "gallery" && <button type="button" onClick={() => focusBox("vm-7073")}>Open Steep Ground gallery</button>}
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
            <div><dt>Peilstein gallery</dt><dd>Immediate derivative</dd></div>
            <div><dt>Topo comparison</dt><dd>844 KB on demand</dd></div>
            <div><dt>Wachau pack</dt><dd>10.3 MB opt-in</dd></div>
          </dl>
          <p>Source scans and print masters stay outside the PWA shell. Heavy resources are requested once and reused.</p>
        </aside>
      )}
    </div>
  );
}
