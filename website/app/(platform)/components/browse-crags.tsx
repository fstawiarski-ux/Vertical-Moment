"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import cragsData from "../data/crags.json";
import { getCragPanoramaHref } from "../../data/panorama-experiences";

type Route = { n: string; g: string };
type Crag = { n: string; la: number; lo: number; r: string[]; db: boolean; gbr: number; rc: number; routes: Route[] };
const CRAGS = cragsData as Crag[];
const VIENNA: [number, number] = [48.2082, 16.3738];

function kmFromVienna(c: Crag) {
  const rad = Math.PI / 180, R = 6371;
  const dLat = (c.la - VIENNA[0]) * rad, dLon = (c.lo - VIENNA[1]) * rad;
  return Math.round(2 * R * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(VIENNA[0] * rad) * Math.cos(c.la * rad) * Math.sin(dLon / 2) ** 2)));
}
function routeBand(route: Route) { return Number((route.g || "").match(/\d+/)?.[0] || 0); }

export function BrowseCrags({ initialCrag = "" }: { initialCrag?: string }) {
  const selectedOnLoad = CRAGS.find(c => c.n.toLocaleLowerCase() === initialCrag.toLocaleLowerCase()) || null;
  const [region, setRegion] = useState(selectedOnLoad?.r[0] || "");
  const [query, setQuery] = useState("");
  const [crag, setCrag] = useState<Crag | null>(selectedOnLoad);
  const [grade, setGrade] = useState("all");
  const [distance, setDistance] = useState("all");
  const [guideOnly, setGuideOnly] = useState(false);
  const [sort, setSort] = useState("near");
  const regions = useMemo(() => [...new Set(CRAGS.flatMap(c => c.r))].sort((a, b) => Math.min(...CRAGS.filter(c => c.r.includes(a)).map(kmFromVienna)) - Math.min(...CRAGS.filter(c => c.r.includes(b)).map(kmFromVienna))), []);
  const walls = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return CRAGS.filter(c => {
      const gradeMatch = grade === "all" || c.routes.some(r => routeBand(r) === Number(grade));
      const distanceMatch = distance === "all" || kmFromVienna(c) <= Number(distance);
      return (!region || c.r.includes(region)) && (!q || c.n.toLocaleLowerCase().includes(q)) && gradeMatch && distanceMatch && (!guideOnly || c.db);
    }).sort((a, b) => sort === "near" ? kmFromVienna(a) - kmFromVienna(b) : (b.gbr || b.rc) - (a.gbr || a.rc)).slice(0, 18);
  }, [region, query, grade, distance, guideOnly, sort]);
  const hasFilters = grade !== "all" || distance !== "all" || guideOnly;
  const regionStats = regions.map(name => {
    const members = CRAGS.filter(c => c.r.includes(name));
    return { name, distance: Math.min(...members.map(kmFromVienna)), crags: members.length, routes: members.reduce((sum, c) => sum + (c.gbr || c.rc || c.routes.length), 0) };
  });

  function chooseRegion(value: string) { setRegion(value); setCrag(null); setQuery(""); }
  function reset() { setRegion(""); setQuery(""); setCrag(null); }

  const filters = (
    <div className="browse-filters">
      <select className="sel" value={grade} onChange={e => { setGrade(e.target.value); setCrag(null); }} aria-label="Filter by route grade">
        <option value="all">Any grade</option><option value="5">Grade 5</option><option value="6">Grade 6</option><option value="7">Grade 7</option><option value="8">Grade 8+</option>
      </select>
      <select className="sel" value={distance} onChange={e => { setDistance(e.target.value); setCrag(null); }} aria-label="Filter by distance from Vienna">
        <option value="all">Any distance</option><option value="50">Within 50 km</option><option value="100">Within 100 km</option><option value="150">Within 150 km</option>
      </select>
      <select className="sel" value={sort} onChange={e => setSort(e.target.value)} aria-label="Order crags">
        <option value="near">Closest to Vienna</option><option value="routes">Most routes</option>
      </select>
      <select className="sel" disabled aria-label="Wall height filter is not mapped yet"><option>Wall height: collecting</option></select>
      <button className={`chip ${guideOnly ? "on" : ""}`} onClick={() => { setGuideOnly(v => !v); setCrag(null); }}>Guidebook</button>
    </div>
  );

  if (crag) {
    const panoramaRegion = region || crag.r[0] || "region";
    const panoramaHref = getCragPanoramaHref(panoramaRegion, crag.n);
    return <div className="card browse-crags drill-card"><div className="eyebrow">{region || "Search result"} / crag</div><h2>{crag.n}</h2><div className="drill-actions"><button className="tree-back" onClick={() => setCrag(null)}>Back to crags</button><Link className="tree-open-map" href={`/?crag=${encodeURIComponent(crag.n)}`}>Open on map</Link><Link className="tree-open-panorama" href={panoramaHref}>Panorama</Link></div><div className="route-list">{crag.routes.length ? crag.routes.map((r, i) => <div key={`${r.n}-${i}`} className="browse-row browse-route"><span>{r.n}</span><small>{r.g}</small><Link className="route-panorama-link" href={getCragPanoramaHref(panoramaRegion, crag.n, r.n)}>Panorama</Link></div>) : <p className="muted">Routes have not been catalogued for this crag yet.</p>}</div></div>;
  }

  if (region || query.trim() || hasFilters) {
    return <div className="card browse-crags drill-card"><div className="eyebrow">{region || "Filtered crags"}</div><h2>Choose a crag</h2>{filters}<div className="wall-finder"><input className="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search a crag name" aria-label="Search climbing walls" /><button className="tree-back" onClick={reset}>All regions</button></div><div className="crag-branch-grid">{walls.map(c => <button key={c.n} className="crag-branch" onClick={() => setCrag(c)}><span>{c.n}</span><small>{c.gbr || c.rc || 0} routes · {kmFromVienna(c)} km</small></button>)}{!walls.length && <p className="muted">No matching crags.</p>}</div></div>;
  }

  return <div className="card browse-crags drill-card"><div className="eyebrow">Browse the map</div><h2>Choose a region</h2><p className="browse-prompt">Tap a region, then choose its crag and routes. Or refine the list first.</p>{filters}<input className="search browse-global-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search a crag name" aria-label="Search climbing walls" /><div className="branch-tree" aria-label="Choose climbing region"><div className="branch-root">All regions</div><div className="branch-grid">{regionStats.map(r => <button key={r.name} className="branch-node" onClick={() => chooseRegion(r.name)}><span>{r.name}</span><small>{r.distance} km · {r.crags} crags · {r.routes} routes</small></button>)}</div></div></div>;
}
