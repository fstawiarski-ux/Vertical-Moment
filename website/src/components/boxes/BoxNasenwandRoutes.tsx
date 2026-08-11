"use client";

import { useMemo, useState } from "react";
import styles from "./BoxNasenwandRoutes.module.css";

type Route = { name: string; grade: string; length?: string; pitches?: string };
type Sector = { name: string; count: number; integrated: boolean };
type WallView = "photo" | "spatial";

const ROUTES: Route[] = [
  { name: "Hatschi!", grade: "5c" },
  { name: "Nasenbärli", grade: "not supplied" },
  { name: "Nicht gesucht + doch gefunden", grade: "5+", length: "170 m", pitches: "8 pitches" },
  { name: "Zwickolo", grade: "6" },
  { name: "Uhu und Kakadu", grade: "6+" },
  { name: "Aufwind", grade: "6" },
  { name: "Bergrettungsweg", grade: "6+", length: "140 m", pitches: "5 pitches" },
  { name: "Tanz auf der Leiter", grade: "7-/7" },
  { name: "Ein bißchen unrund", grade: "7-/7" },
  { name: "Chaos im Westen", grade: "7+" },
  { name: "Die Prinzessin & das Prunkstück", grade: "8-" },
  { name: "Silberhochzeit", grade: "not supplied" },
];

const SECTORS: Sector[] = [
  { name: "Upper", count: 12, integrated: true },
  { name: "Central", count: 39, integrated: false },
  { name: "Lower", count: 33, integrated: false },
  { name: "Deeper", count: 23, integrated: false },
];

const VIEWS: Record<WallView, { label: string; src: string; alt: string; note: string }> = {
  photo: {
    label: "Photo",
    src: "/photography/nasenwand/nasenwand-photo-1280.webp",
    alt: "Drone photograph of the Nasenwand rock face in the Wachau",
    note: "Source wall photograph",
  },
  spatial: {
    label: "Spatial",
    src: "/photography/nasenwand/nasenwand-spatial-1280.webp",
    alt: "Monochrome spatial-relief study derived from the Nasenwand drone photograph",
    note: "Derived spatial study - geometry remains provisional",
  },
};

function focusBox(id: string) {
  window.dispatchEvent(new CustomEvent("vm:focus-box", { detail: { id, mode: "expanded" } }));
}

export default function BoxNasenwandRoutes() {
  const [sectorName, setSectorName] = useState("Upper");
  const [selectedName, setSelectedName] = useState("Aufwind");
  const [view, setView] = useState<WallView>("photo");

  const sector = useMemo(
    () => SECTORS.find((candidate) => candidate.name === sectorName) ?? SECTORS[0],
    [sectorName],
  );
  const selected = useMemo(
    () => ROUTES.find((route) => route.name === selectedName) ?? ROUTES[0],
    [selectedName],
  );
  const wallView = VIEWS[view];

  return (
    <div className={styles.workspace}>
      <header className={styles.toolbar}>
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
        <div className={styles.viewSwitch} aria-label="Wall view">
          {(Object.keys(VIEWS) as WallView[]).map((id) => (
            <button key={id} type="button" aria-pressed={id === view} onClick={() => setView(id)}>{VIEWS[id].label}</button>
          ))}
        </div>
      </header>

      <div className={styles.routeRail} aria-label={`${sector.name} sector routes`}>
        {sector.integrated ? ROUTES.map((route) => (
          <button key={route.name} type="button" aria-pressed={route.name === selected.name} onClick={() => setSelectedName(route.name)}>
            <strong>{route.name}</strong><small>{route.grade}</small>
          </button>
        )) : (
          <div className={styles.pendingRail}>
            <strong>{sector.count} routes identified</strong>
            <span>Individual route rows are not integrated yet.</span>
          </div>
        )}
      </div>

      <div className={styles.main}>
        <section className={styles.wall} aria-label="Nasenwand wall study">
          <img key={view} src={wallView.src} alt={wallView.alt} draggable={false} />
          <div className={styles.wallShade} aria-hidden="true" />
          <div className={styles.wallCaption}>
            <small>Wachau - Nasenwand - {sector.name} sector</small>
            <strong>{sector.integrated ? selected.name : `${sector.name} catalogue`}</strong>
            <span>{wallView.note}</span>
          </div>
          <div className={styles.wallActions}>
            <button type="button" onClick={() => focusBox("wachau-16")}>Open panorama</button>
            <button type="button" onClick={() => focusBox("nasenwand-model")}>Open shared 3D</button>
          </div>
        </section>

        <aside className={styles.details} aria-label="Selected route details">
          {sector.integrated ? (
            <>
              <small>Upper Sector - working reference</small>
              <h3>{selected.name}</h3>
              <dl>
                <div><dt>Grade</dt><dd>{selected.grade}</dd></div>
                {selected.length && <div><dt>Length</dt><dd>{selected.length}</dd></div>}
                {selected.pitches && <div><dt>Line</dt><dd>{selected.pitches}</dd></div>}
              </dl>
              <p>Route geometry is deliberately not drawn here. Names and supplied facts remain a working reference until field registration is approved.</p>
            </>
          ) : (
            <>
              <small>{sector.name} Sector</small>
              <h3>{sector.count} route records</h3>
              <p>This sector count is preserved from the concept. Names, grades and route geometry will appear only after their source data is integrated and reviewed.</p>
            </>
          )}
          <div className={styles.references}>
            <a href="https://www.bergsteigen.com/touren/klettergarten/nasenwand-duernstein-wachau/" target="_blank" rel="noreferrer">Bergsteigen reference</a>
            <a href="https://www.thecrag.com/climbing/wachau/maps#48.402022,15.518068,18.0,,auto" target="_blank" rel="noreferrer">theCrag map</a>
          </div>
          <footer>Provisional climbing reference - not a safety or navigation product.</footer>
        </aside>
      </div>
    </div>
  );
}
