"use client";

import { useMemo, useState } from "react";
import styles from "./BoxWallReveal.module.css";

type StageId = "place" | "scrub" | "topo" | "model";

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
    id: "scrub",
    index: "02",
    label: "Scrub",
    eyebrow: "Shared app-shell motion",
    title: "Move through the wall at your pace.",
    body: "The Lab reuses its 3.1 MB background scrub. The older 17.7 MB prototype is deliberately not requested here.",
    status: "3.1 MB shared - on demand",
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
  {
    id: "model",
    index: "04",
    label: "3D",
    eyebrow: "Shared optimized wall",
    title: "Turn the same wall in your hands.",
    body: "The browser-ready model lives in one shared box, so this story never downloads or initializes a duplicate viewer.",
    status: "1.66 MB shared - on demand",
  },
];

function focusBox(id: string) {
  window.dispatchEvent(new CustomEvent("vm:focus-box", { detail: { id, mode: "expanded" } }));
}

function replayApproachJourney() {
  window.dispatchEvent(new CustomEvent("vm:replay-intro"));
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

        {active === "scrub" && (
          <div className={styles.sharedStage}>
            <img className={styles.media} src="/photography/nasenwand/media/poster-1600.webp" alt="Nasenwand wall motion poster" />
            <div className={styles.sharedCard}>
              <small>One scrub, shared by the whole workspace</small>
              <strong>3.1 MB app-shell motion</strong>
              <span>The 17.7 MB Wall Reveal prototype remains archived and unloaded.</span>
              <button type="button" onClick={replayApproachJourney}>Replay the approach journey</button>
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

        {active === "model" && (
          <div className={styles.sharedStage}>
            <img className={styles.media} src="/photography/nasenwand/nasenwand-spatial-1280.webp" alt="Preview of the Nasenwand spatial model" />
            <div className={styles.sharedCard}>
              <small>208k triangles - 1.66 MB</small>
              <strong>Use the shared 3D wall</strong>
              <span>Orbit, pan and zoom remain lazy until you open the dedicated box.</span>
              <button type="button" onClick={() => focusBox("nasenwand-model")}>Open shared 3D</button>
            </div>
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
            <button type="button" onClick={() => setBudgetOpen((current) => !current)} aria-expanded={budgetOpen}>Media: {stage.status}</button>
          </div>
        </section>
      </div>

      {budgetOpen && (
        <aside className={styles.budget} aria-label="Wall Reveal media delivery plan">
          <header><small>Delivery plan</small><button type="button" onClick={() => setBudgetOpen(false)}>Close</button></header>
          <dl>
            <div><dt>First view</dt><dd>183 KB photo</dd></div>
            <div><dt>Shared scrub</dt><dd>3.1 MB on demand</dd></div>
            <div><dt>Topo comparison</dt><dd>844 KB on demand</dd></div>
            <div><dt>Shared 3D</dt><dd>1.66 MB on demand</dd></div>
            <div><dt>Wachau pack</dt><dd>10.3 MB opt-in</dd></div>
            <div><dt>Legacy scrub</dt><dd>17.7 MB not loaded</dd></div>
          </dl>
          <p>Source scans and print masters stay outside the PWA shell. Heavy resources are requested once and reused.</p>
        </aside>
      )}
    </div>
  );
}
