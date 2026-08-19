"use client";

import { useMemo, useState } from "react";
import { NASENWAND_ROUTES, NASENWAND_SECTORS, type NasenwandRoute } from "../../../app/data/nasenwand-routes";
import styles from "./BoxNasenwandRoutes.module.css";

const ROUTES: NasenwandRoute[] = NASENWAND_ROUTES;
const SECTORS = NASENWAND_SECTORS;

function focusBox(id: string) {
  window.dispatchEvent(new CustomEvent("vm:focus-box", { detail: { id, mode: "normal" } }));
}

export default function BoxNasenwandRoutes() {
  const [sectorName, setSectorName] = useState("Upper");
  const [selectedName, setSelectedName] = useState("Aufwind");

  const sector = useMemo(
    () => SECTORS.find((candidate) => candidate.name === sectorName) ?? SECTORS[0],
    [sectorName],
  );
  const selected = useMemo(
    () => ROUTES.find((route) => route.name === selectedName) ?? ROUTES[0],
    [selectedName],
  );
  const routeOptions = sector.integrated ? ROUTES : [];

  return (
    <div className={styles.workspace}>
      <header className={styles.toolbar}>
        <div>
          <small className={styles.eyebrow}>Nasenwand · Wachau</small>
          <strong>Quick sector routes</strong>
        </div>
        <nav aria-label="Nasenwand sectors">
          {SECTORS.map((candidate) => (
            <button
              key={candidate.name}
              type="button"
              aria-pressed={candidate.name === sector.name}
              onClick={() => setSectorName(candidate.name)}
            >
              <span>{candidate.name}</span><small>{candidate.count}</small>
            </button>
          ))}
        </nav>
      </header>

      <div className={styles.main}>
        <section className={styles.wall} aria-label="Nasenwand wall photograph">
          <img src="/photography/nasenwand/nasenwand-photo-1280.webp" alt="Drone photograph of the Nasenwand rock face in the Wachau" draggable={false} />
          <div className={styles.wallShade} aria-hidden="true" />
          <div className={styles.wallCaption}>
            <small>{sector.name} sector · source wall photograph</small>
            <strong>Aufwind</strong>
            <span>Photo and spatial study live in the Wall workspace.</span>
          </div>
          <div className={styles.wallActions}>
            <button type="button" onClick={() => focusBox("wachau-16")}>Open panorama</button>
            <button type="button" onClick={() => focusBox("nasenwand-model")}>Open topo workspace</button>
          </div>
        </section>

        <aside className={styles.details} aria-label={`${sector.name} sector quick route list`}>
          <div className={styles.detailHeading}>
            <div><small>Sector</small><h3>{sector.name}</h3></div>
            <span>{sector.count} routes</span>
          </div>
          {sector.integrated ? (
            <>
              <div className={styles.routeList} aria-label={`${sector.name} quick route list`}>
                {routeOptions.map((route) => (
                  <button key={route.name} type="button" aria-pressed={route.name === selected.name} onClick={() => setSelectedName(route.name)}>
                    <span>{route.name}</span><strong>{route.grade}</strong>
                  </button>
                ))}
              </div>
              <div className={styles.selectedRoute}>
                <small>Selected route</small>
                <h4>{selected.name}</h4>
                <dl>
                  <div><dt>Grade</dt><dd>{selected.grade}</dd></div>
                  {selected.length && <div><dt>Length</dt><dd>{selected.length}</dd></div>}
                  {selected.pitches && <div><dt>Line</dt><dd>{selected.pitches}</dd></div>}
                </dl>
              </div>
            </>
          ) : (
            <div className={styles.pending}>
              <strong>{sector.count} route records identified</strong>
              <p>Quick names and grades are not integrated for this sector yet. Open the Topo workspace for the reviewed route layer.</p>
              <button type="button" onClick={() => focusBox("nasenwand-model")}>Open Topo workspace</button>
            </div>
          )}
          <footer>Provisional climbing reference · not a safety or navigation product.</footer>
        </aside>
      </div>
    </div>
  );
}
