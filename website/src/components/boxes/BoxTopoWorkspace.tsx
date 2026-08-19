"use client";

import { useMemo, useState } from "react";
import type { ExploreImageAsset, ExploreModelAsset } from "../../core/types";
import { NASENWAND_ROUTES } from "../../../app/data/nasenwand-routes";
import { Box3DModel } from "./Box3DModel";
import styles from "./BoxTopoWorkspace.module.css";

type TopoView = "model" | "routes" | "topo";

export function BoxTopoWorkspace({ model, poster, isActive }: { model: ExploreModelAsset; poster?: ExploreImageAsset; isActive: boolean }) {
  const [view, setView] = useState<TopoView>("model");
  const [selectedName, setSelectedName] = useState("Aufwind");
  const selected = useMemo(() => NASENWAND_ROUTES.find((route) => route.name === selectedName) ?? NASENWAND_ROUTES[0], [selectedName]);

  return (
    <div className={styles.workspace}>
      <nav className={styles.routeRail} aria-label="Topo route list">
        {NASENWAND_ROUTES.map((route) => (
          <button key={route.name} type="button" aria-pressed={route.name === selected.name} onClick={() => { setSelectedName(route.name); setView("routes"); }}>
            <span>{route.name}</span><small>{route.grade}</small>
          </button>
        ))}
      </nav>
      <div className={styles.viewTabs} role="tablist" aria-label="Topo workspace content">
        {(["model", "routes", "topo"] as TopoView[]).map((candidate) => (
          <button key={candidate} type="button" role="tab" aria-selected={candidate === view} onClick={() => setView(candidate)}>
            {candidate === "model" ? "3D model" : candidate === "routes" ? "Route detail" : "Topo"}
          </button>
        ))}
      </div>
      <main className={styles.content}>
        {view === "model" && <Box3DModel model={model} poster={poster} isActive={isActive} />}
        {view === "routes" && (
          <section className={styles.routeDetail} aria-label={`${selected.name} topo route detail`}>
            <small>Route detail · Nasenwand</small>
            <h3>{selected.name}</h3>
            <dl>
              <div><dt>Grade</dt><dd>{selected.grade}</dd></div>
              {selected.length && <div><dt>Length</dt><dd>{selected.length}</dd></div>}
              {selected.pitches && <div><dt>Line</dt><dd>{selected.pitches}</dd></div>}
            </dl>
            <p>Names and supplied facts remain a working reference. Route geometry stays hidden until field registration is approved.</p>
          </section>
        )}
        {view === "topo" && (
          <figure className={styles.topo}>
            <img src="/photography/nasenwand/nasenwand-topo-1280.webp" alt="Provisional Nasenwand topo study" />
            <figcaption>Provisional topo layer · use the route rail above to choose a route.</figcaption>
          </figure>
        )}
      </main>
    </div>
  );
}
