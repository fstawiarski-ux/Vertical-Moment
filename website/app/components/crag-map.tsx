"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import cragsData from "../data/crags.json";

type Route = { n: string; g: string; gb: string; d: string; gp: string };
type Crag = {
  n: string; la: number; lo: number; r: string[]; db: boolean; rc: number;
  osm?: string | null; web?: string | null; topo?: string | null; wiki?: string | null;
  gbr: number; routes: Route[];
};
const CRAGS = cragsData as Crag[];
const VIENNA: [number, number] = [48.2082, 16.3738];
const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
const GOLD = "#D89A34", SAGE = "#93A382";

function km(la: number, lo: number) {
  const R = 6371, r = Math.PI / 180;
  const dLa = (la - VIENNA[0]) * r, dLo = (lo - VIENNA[1]) * r;
  return Math.round(2 * R * Math.asin(Math.sqrt(
    Math.sin(dLa / 2) ** 2 + Math.cos(VIENNA[0] * r) * Math.cos(la * r) * Math.sin(dLo / 2) ** 2)));
}
function loadLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    if (w.L) return resolve(w.L);
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const css = document.createElement("link");
      css.rel = "stylesheet"; css.href = LEAFLET_CSS; document.head.appendChild(css);
    }
    const js = document.createElement("script");
    js.src = LEAFLET_JS; js.async = true;
    js.onload = () => resolve((window as any).L);
    js.onerror = () => reject(new Error("Leaflet failed to load — check your connection."));
    document.head.appendChild(js);
  });
}

export function CragMap({ initialCragName }: { initialCragName?: string } = {}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const layer = useRef<any>(null);
  const L = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [crag, setCrag] = useState<Crag | null>(null);
  const deepLinkApplied = useRef(false);

  const regions = useMemo(() => {
    const m = new Map<string, number>();
    CRAGS.forEach(c => c.r.forEach(rg => m.set(rg, (m.get(rg) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, []);

  const visible = useMemo(
    () => (region ? CRAGS.filter(c => c.r.includes(region)) : CRAGS),
    [region]
  );

  // init map once
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((Lib) => {
      if (cancelled || map.current || !mapEl.current) return;
      L.current = Lib;
      const m = Lib.map(mapEl.current, { scrollWheelZoom: false }).setView([47.95, 16.05], 9);
      Lib.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { maxZoom: 19, subdomains: "abcd", attribution: "&copy; OpenStreetMap &copy; CARTO" }).addTo(m);
      Lib.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
        { maxZoom: 19, subdomains: "abcd", opacity: 0.85 }).addTo(m);
      Lib.marker(VIENNA, {
        icon: Lib.divIcon({ className: "", html: '<div class="vm-vienna"><span>WIEN</span></div>', iconSize: [34, 34], iconAnchor: [17, 17] }),
        interactive: false, zIndexOffset: 1000,
      }).addTo(m);
      m.on("click", () => setCrag(null));
      layer.current = Lib.layerGroup().addTo(m);
      map.current = m;
      setReady(true);
    }).catch(e => setErr(e.message));
    return () => { cancelled = true; };
  }, []);

  // deep-link: open a specific crag on load (e.g. from Explore's search results)
  useEffect(() => {
    if (!ready || deepLinkApplied.current || !initialCragName) return;
    deepLinkApplied.current = true;
    const c = CRAGS.find(x => x.n === initialCragName);
    if (!c) return;
    if (c.r[0]) setRegion(c.r[0]);
    setCrag(c);
    map.current?.setView([c.la, c.lo], 13);
  }, [ready, initialCragName]);

  // redraw markers when the visible set changes
  useEffect(() => {
    if (!ready || !L.current || !layer.current) return;
    const Lib = L.current, lg = layer.current;
    lg.clearLayers();
    const pts: [number, number][] = [];
    visible.forEach(c => {
      pts.push([c.la, c.lo]);
      const mk = Lib.circleMarker([c.la, c.lo], {
        radius: 6, weight: 1.5, color: "#F2ECE0", fillColor: c.db ? GOLD : SAGE, fillOpacity: 0.95,
      });
      mk.on("click", (e: any) => {
        e.originalEvent?.stopPropagation?.();
        if (!region && c.r[0]) setRegion(c.r[0]);
        setCrag(c);
        mk.bindPopup(popupHtml(c)).openPopup();
      });
      mk.addTo(lg);
    });
    // don't refit bounds once a deep link has already framed a specific crag
    if (pts.length && !(initialCragName && crag?.n === initialCragName)) {
      const b = Lib.latLngBounds(pts.concat([VIENNA]));
      map.current.fitBounds(b, { padding: [30, 30], maxZoom: 12 });
    }
  }, [ready, visible, region]);

  function popupHtml(c: Crag) {
    const links: string[] = [];
    if (c.web) links.push(`<a href="${c.web}" target="_blank" rel="noopener">Website</a>`);
    if (c.topo) links.push(`<a href="${c.topo}" target="_blank" rel="noopener">Topo</a>`);
    if (c.osm) links.push(`<a href="https://www.openstreetmap.org/${c.osm}" target="_blank" rel="noopener">OSM</a>`);
    const rc = c.gbr || c.rc || 0;
    return `<strong>${c.n}</strong><br>${km(c.la, c.lo)} km from Wien · ${rc} routes<br>
      ${c.db ? "In guidebook" : "OSM extra"}<br>${links.join(" · ")}`;
  }

  // panel
  let title = "REGIONS", back: (() => void) | null = null, count = "";
  if (crag) { title = crag.n.toUpperCase(); back = () => setCrag(null); count = `${crag.gbr || crag.rc} routes`; }
  else if (region) { title = region.toUpperCase(); back = () => setRegion(null); count = `${visible.length} crags`; }
  else { count = `${regions.length} regions`; }

  return (
    <div className="mapgrid">
      <div id="map" ref={mapEl}>
        {err && <div style={{ padding: 20 }} className="muted">{err} The lists on the right still work.</div>}
      </div>
      <aside className="panel">
        <div className="panel-head">
          {back && <button className="crumb" onClick={back}>← Back</button>}
          <h2>{title}</h2>
          <span className="pcount">{count}</span>
        </div>
        <div className="plist">
          {crag ? (
            <CragRoutes crag={crag} />
          ) : region ? (
            visible.slice().sort((a, b) => (b.db ? 1 : 0) - (a.db ? 1 : 0) || a.n.localeCompare(b.n)).map(c => (
              <button key={c.n} className="prow" onClick={() => { setCrag(c); map.current?.setView([c.la, c.lo], 13); }}>
                <span className={`rdot ${c.db ? "g-dot" : "s-dot"}`} />
                <span className="rname">{c.n}</span>
                <span className="rmeta">{(c.gbr || c.rc) ? `${c.gbr || c.rc} rt` : "—"}</span>
              </button>
            ))
          ) : (
            regions.map(r => (
              <button key={r.name} className="prow" onClick={() => setRegion(r.name)}>
                <span className="rname">{r.name}</span>
                <span className="rmeta">{r.count} crags</span>
              </button>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

function CragRoutes({ crag }: { crag: Crag }) {
  const links: React.ReactNode[] = [];
  if (crag.web) links.push(<a key="w" href={crag.web} target="_blank" rel="noopener" style={{ color: "var(--gold)" }}>Website</a>);
  if (crag.topo) links.push(<a key="t" href={crag.topo} target="_blank" rel="noopener" style={{ color: "var(--gold)" }}>Topo</a>);
  if (crag.osm) links.push(<a key="o" href={`https://www.openstreetmap.org/${crag.osm}`} target="_blank" rel="noopener" style={{ color: "var(--gold)" }}>OSM</a>);
  const dotCls = (g: string) => g?.startsWith("Present") ? "gps-present" : g?.startsWith("Crag") ? "gps-approx" : "gps-missing";
  return (
    <>
      <div style={{ padding: "2px 8px 10px", fontSize: 12.5, color: "var(--sage)" }}>
        {km(crag.la, crag.lo)} km from Wien · {crag.db ? "In guidebook" : "OSM extra"}
        {links.length > 0 && <div style={{ marginTop: 6, display: "flex", gap: 12 }}>{links}</div>}
      </div>
      {crag.routes.length ? (
        crag.routes.map((r, i) => (
          <div key={i} className="prow route">
            <span className={`rdot`} style={{ background: "var(--gold)" }} title={r.gp} />
            <span className="rname">{r.n}</span>
            <span className="rmeta g" style={{ color: "var(--chalk)" }}>{r.g}</span>
          </div>
        ))
      ) : (
        <div style={{ padding: 10, fontSize: 13, color: "var(--sage)" }}>
          No catalogued routes yet. This crag came from OpenStreetMap — a contributor mission can transcribe its routes.
        </div>
      )}
    </>
  );
}
