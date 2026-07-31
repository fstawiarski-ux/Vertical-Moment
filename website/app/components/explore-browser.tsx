"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import routesData from "../data/routes.json";
import cragsData from "../data/crags.json";

type Route = { n: string; g: string; gb: string; gs: number | null; d: string; a: string; w: string; la: number | null; gp: string; cr: string };
type Crag = { n: string; la: number; lo: number; r: string[]; db: boolean; rc: number; gbr: number; web?: string | null; topo?: string | null; osm?: string | null };
const ROUTES = routesData as Route[];
const CRAGS = cragsData as Crag[];
const VIENNA: [number, number] = [48.2082, 16.3738];
const km = (la: number, lo: number) => {
  const R = 6371, r = Math.PI / 180, dLa = (la - VIENNA[0]) * r, dLo = (lo - VIENNA[1]) * r;
  return Math.round(2 * R * Math.asin(Math.sqrt(Math.sin(dLa / 2) ** 2 + Math.cos(VIENNA[0] * r) * Math.cos(la * r) * Math.sin(dLo / 2) ** 2)));
};
const cragFor = (r: Route) => CRAGS.find(c => c.n === r.cr || c.n === r.w) || null;

export function ExploreBrowser() {
  const [tab, setTab] = useState<"routes" | "crags">("routes");
  return (
    <>
      <div className="subtabs">
        <button className={`subtab ${tab === "routes" ? "on" : ""}`} onClick={() => setTab("routes")}>Routes</button>
        <button className={`subtab ${tab === "crags" ? "on" : ""}`} onClick={() => setTab("crags")}>Crags</button>
      </div>
      {tab === "routes" ? <RouteSearch /> : <CragCards />}
    </>
  );
}

// Search-first: no flat table of 632 rows. Type a name, get a short list of
// matches, and jump straight into the map's region -> crag -> route drill-down.
function RouteSearch() {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return ROUTES.filter(r =>
      r.n.toLowerCase().includes(s) || (r.w || "").toLowerCase().includes(s) || (r.cr || "").toLowerCase().includes(s)
    ).slice(0, 30);
  }, [q]);

  return (
    <>
      <div className="filters">
        <input
          className="search"
          placeholder="Type a route, wall or crag name…"
          value={q}
          onChange={e => setQ(e.target.value)}
          autoFocus
        />
      </div>
      {!q.trim() ? (
        <div className="muted" style={{ padding: "18px 4px", maxWidth: 520 }}>
          Start typing to find a route — a match opens straight into the map&apos;s
          drill-down. Browsing by area instead? Use the <Link href="/" style={{ color: "var(--terra)", fontWeight: 600 }}>map on the home page</Link>.
        </div>
      ) : (
        <>
          <div className="count">
            {results.length} match{results.length === 1 ? "" : "es"}
            {results.length === 30 ? " — showing the first 30, refine your search" : ""}
          </div>
          <div style={{ background: "var(--forest)", borderRadius: 16, padding: "6px 6px 2px" }}>
            {results.length === 0 && (
              <div className="muted" style={{ padding: "14px 10px", color: "var(--sage)" }}>No matches.</div>
            )}
            {results.map((r, i) => {
              const crag = cragFor(r);
              const content = (
                <>
                  <span className="rdot" style={{ background: "var(--gold)" }} />
                  <span className="rname" style={{ color: "var(--chalk)" }}>{r.n}</span>
                  <span className="rmeta" style={{ color: "var(--sage)" }}>{r.g} · {r.cr || r.w}</span>
                </>
              );
              return crag ? (
                <Link key={i} href={`/?crag=${encodeURIComponent(crag.n)}`} className="prow">{content}</Link>
              ) : (
                <div key={i} className="prow" style={{ cursor: "default", opacity: 0.7 }} title="Not yet linked to a mapped crag">
                  {content}
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function CragCards() {
  const [q, setQ] = useState(""), [region, setRegion] = useState(""), [guideOnly, setGuideOnly] = useState(false);
  const regions = useMemo(() => [...new Set(CRAGS.flatMap(c => c.r))].sort(), []);
  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return CRAGS.filter(c =>
      (!region || c.r.includes(region)) && (!guideOnly || c.db) &&
      (!s || c.n.toLowerCase().includes(s) || c.r.join(" ").toLowerCase().includes(s)))
      .sort((a, b) => (b.db ? 1 : 0) - (a.db ? 1 : 0) || a.n.localeCompare(b.n));
  }, [q, region, guideOnly]);

  return (
    <>
      <div className="filters">
        <input className="search" placeholder="Search crag or region…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="sel" value={region} onChange={e => setRegion(e.target.value)}><option value="">All regions</option>{regions.map(r => <option key={r}>{r}</option>)}</select>
        <button className="chip" aria-pressed={guideOnly} onClick={() => setGuideOnly(v => !v)}>In guidebook</button>
      </div>
      <div className="count">{rows.length} crag{rows.length === 1 ? "" : "s"}</div>
      <div className="cgrid">
        {rows.slice(0, 60).map((c, i) => {
          const rc = c.gbr || c.rc || 0;
          return (
            <article key={i} className="card crag">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span className={`badge ${c.db ? "guide" : "osm"}`}>{c.db ? "In guidebook" : "OSM extra"}</span>
                <span className="pill">{c.r[0] || "—"}</span>
              </div>
              <h3>{c.n}</h3>
              <div className="meta"><span className="pill">{rc} routes</span>{c.r.length > 1 && <span className="pill">+{c.r.length - 1} region</span>}</div>
              <div className="muted" style={{ fontSize: 12.5 }}>{km(c.la, c.lo)} km from Wien</div>
              <div style={{ marginTop: 10 }}>
                <Link href={`/?crag=${encodeURIComponent(c.n)}`}>Open on map</Link>
                {c.web && <a href={c.web} target="_blank" rel="noopener">Website</a>}
                {c.topo && <a href={c.topo} target="_blank" rel="noopener">Topo</a>}
                {c.osm && <a href={`https://www.openstreetmap.org/${c.osm}`} target="_blank" rel="noopener">OSM</a>}
              </div>
            </article>
          );
        })}
        {rows.length > 60 && (
          <div className="muted" style={{ gridColumn: "1/-1", textAlign: "center", padding: "10px 0" }}>
            Showing the first 60 of {rows.length} — narrow your search or region.
          </div>
        )}
      </div>
    </>
  );
}
