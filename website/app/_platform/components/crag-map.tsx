"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import cragsData from "../data/crags.json";
import modelsData from "../data/models.json";
import { Model3D } from "./model-3d";

type Route = { n: string; g: string; gb: string; d: string; gp: string };
type Crag = {
  n: string; la: number; lo: number; r: string[]; db: boolean; rc: number;
  osm?: string | null; web?: string | null; topo?: string | null; wiki?: string | null;
  gbr: number; routes: Route[];
};
const CRAGS = cragsData as Crag[];
type WallModel = { wall_id: string; crag: string; glb: string; webReady: boolean; note?: string };
const MODELS = modelsData as WallModel[];
const VIENNA: [number, number] = [48.2082, 16.3738];
const STEPHANSPLATZ: [number, number] = [48.2085, 16.3731];
const JAMMERWANDL: [number, number] = [48.015385, 16.198357];
const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
const GOLD = "#D89A34", SAGE = "#93A382", TERRA = "#BF6B4F";

function regionColor(index: number, total: number) {
  const hue = Math.round((index * 360) / Math.max(total, 1));
  return `hsl(${hue}, 60%, 46%)`;
}

// simple 2D convex hull (monotone chain) — treats lat/lon as a flat plane,
// which is a fine approximation at this regional scale
function convexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points;
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}

function distanceKm(la1: number, lo1: number, la2: number, lo2: number) {
  const R = 6371, r = Math.PI / 180;
  const dLa = (la2 - la1) * r, dLo = (lo2 - lo1) * r;
  return 2 * R * Math.asin(Math.sqrt(
    Math.sin(dLa / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dLo / 2) ** 2));
}
function km(la: number, lo: number) {
  return Math.round(distanceKm(VIENNA[0], VIENNA[1], la, lo));
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

export function CragMap({ initialCragName, showPanel = true }: { initialCragName?: string; showPanel?: boolean } = {}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const layer = useRef<any>(null);
  const geoLayer = useRef<any>(null);
  const viennaRings = useRef<any>(null);
  const measureLayer = useRef<any>(null);
  const approachLayer = useRef<any>(null);
  const approachTimer = useRef<number | null>(null);
  const regionLayer = useRef<any>(null);
  const L = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [crag, setCrag] = useState<Crag | null>(null);
  const deepLinkApplied = useRef(false);

  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "denied" | "timeout" | "unavailable" | "unsupported">("idle");
  const [nearbyMode, setNearbyMode] = useState(false);
  const [radiusKm, setRadiusKm] = useState(50);
  const [measuring, setMeasuring] = useState(false);
  const measuringRef = useRef(false);
  const [measurePoints, setMeasurePoints] = useState<{ lat: number; lon: number }[]>([]);
  const [approachStatus, setApproachStatus] = useState<"idle" | "loading" | "playing" | "ready" | "overview">("idle");

  const geoMessages: Record<string, string> = {
    denied: "Location permission was denied. Check your browser's site settings (and your phone's location services) and try again.",
    timeout: "Took too long to get a fix — weak GPS signal or a slow first request. Try again, ideally outdoors.",
    unavailable: "Your device couldn't determine a location right now. Try again in a moment.",
    unsupported: "This browser doesn't support location. Browse by region instead.",
  };

  const regions = useMemo(() => {
    const m = new Map<string, number>();
    CRAGS.forEach(c => c.r.forEach(rg => m.set(rg, (m.get(rg) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, []);

  const regionColorMap = useMemo(() => {
    const map = new Map<string, string>();
    regions.forEach((r, i) => map.set(r.name, regionColor(i, regions.length)));
    return map;
  }, [regions]);

  const cragColor = (c: Crag) => regionColorMap.get(c.r[0]) || SAGE;

  const nearby = useMemo(() => {
    if (!nearbyMode || !userPos) return [];
    return CRAGS
      .map(c => ({ ...c, dist: distanceKm(userPos.lat, userPos.lon, c.la, c.lo) }))
      .filter(c => c.dist <= radiusKm)
      .sort((a, b) => a.dist - b.dist);
  }, [nearbyMode, userPos, radiusKm]);

  const visible = useMemo(() => {
    if (nearbyMode && userPos) return nearby;
    return region ? CRAGS.filter(c => c.r.includes(region)) : CRAGS;
  }, [region, nearbyMode, userPos, nearby]);

  function useMyLocation() {
    if (!("geolocation" in navigator)) { setGeoStatus("unsupported"); return; }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserPos({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoStatus("idle");
        setNearbyMode(true);
        setRegion(null);
        setCrag(null);
      },
      (e) => {
        if (e.code === e.PERMISSION_DENIED) setGeoStatus("denied");
        else if (e.code === e.TIMEOUT) setGeoStatus("timeout");
        else setGeoStatus("unavailable");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    );
  }

  // init map once
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((Lib) => {
      if (cancelled || map.current || !mapEl.current) return;
      L.current = Lib;
      const m = Lib.map(mapEl.current, { scrollWheelZoom: true, zoomControl: false }).setView([47.95, 16.05], 9);
      Lib.control.zoom({ position: "topright" }).addTo(m);

      const light = Lib.layerGroup([
        Lib.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
          { maxZoom: 19, subdomains: "abcd", attribution: "&copy; OpenStreetMap &copy; CARTO" }),
        Lib.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
          { maxZoom: 19, subdomains: "abcd", opacity: 0.85 }),
      ]);
      const terrain = Lib.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        maxZoom: 17, subdomains: "abc",
        attribution: "&copy; OpenStreetMap &copy; OpenTopoMap (CC-BY-SA)",
      }).addTo(m);
      const satellite = Lib.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, attribution: "Tiles &copy; Esri" }
      );
      const streets = Lib.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: "&copy; OpenStreetMap contributors",
      });
      const explorer = Lib.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19, subdomains: "abcd", attribution: "&copy; OpenStreetMap &copy; CARTO",
      });
      Lib.control.layers(
        { "Light": light, "OpenStreetMap": streets, "Explorer": explorer, "Terrain": terrain, "Satellite": satellite },
        undefined,
        { position: "topright" }
      ).addTo(m);

      Lib.marker(VIENNA, {
        icon: Lib.divIcon({ className: "", html: '<div class="vm-vienna"><span>WIEN</span></div>', iconSize: [34, 34], iconAnchor: [17, 17] }),
        interactive: false, zIndexOffset: 1000,
      }).addTo(m);
      m.on("click", (e: any) => {
        if (measuringRef.current) {
          setMeasurePoints(points => points.length >= 2 ? [{ lat: e.latlng.lat, lon: e.latlng.lng }] : [...points, { lat: e.latlng.lat, lon: e.latlng.lng }]);
        } else {
          setCrag(null);
        }
      });
      regionLayer.current = Lib.layerGroup().addTo(m);
      layer.current = Lib.layerGroup().addTo(m);
      geoLayer.current = Lib.layerGroup().addTo(m);
      viennaRings.current = Lib.layerGroup().addTo(m);
      measureLayer.current = Lib.layerGroup().addTo(m);
      approachLayer.current = Lib.layerGroup().addTo(m);
      map.current = m;
      setReady(true);
    }).catch(e => setErr(e.message));
    return () => { cancelled = true; if (approachTimer.current) window.clearInterval(approachTimer.current); };
  }, []);

  // Permanent distance reference from Vienna: this stays visible even before
  // a visitor shares location, so the map explains its regional scale.
  useEffect(() => {
    if (!ready || !L.current || !viennaRings.current) return;
    const Lib = L.current;
    viennaRings.current.clearLayers();
    [50, 100, 150].forEach(radius => {
      Lib.circle(VIENNA, {
        radius: radius * 1000, color: "#73816B", weight: 1,
        opacity: 0.48, dashArray: "4 6", fill: false, interactive: false,
      }).bindTooltip(`${radius} km`, {
        permanent: true, direction: "right", className: "distance-ring-label", opacity: 0.85,
      }).addTo(viennaRings.current);
    });
  }, [ready]);

  useEffect(() => {
    measuringRef.current = measuring;
  }, [measuring]);

  useEffect(() => {
    if (!ready || !L.current || !measureLayer.current) return;
    const Lib = L.current;
    measureLayer.current.clearLayers();
    if (!measurePoints.length) return;
    const points = measurePoints.map(p => [p.lat, p.lon] as [number, number]);
    points.forEach(p => Lib.circleMarker(p, { radius: 5, color: "#fff", weight: 2, fillColor: TERRA, fillOpacity: 1 }).addTo(measureLayer.current));
    if (points.length === 2) {
      const total = distanceKm(measurePoints[0].lat, measurePoints[0].lon, measurePoints[1].lat, measurePoints[1].lon);
      Lib.polyline(points, { color: TERRA, weight: 3, dashArray: "6 5" }).bindTooltip(`${total.toFixed(1)} km`, {
        permanent: true, direction: "center", className: "measure-label",
      }).addTo(measureLayer.current);
    }
  }, [ready, measurePoints]);

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

  // draw region boundary shapes once (approximate — convex hull of each
  // region's crags, not an authoritative administrative boundary)
  useEffect(() => {
    if (!ready || !L.current || !regionLayer.current) return;
    const Lib = L.current;
    regionLayer.current.clearLayers();
    if (region || nearbyMode || crag) return; // declutter once drilled in
    regions.forEach(r => {
      const pts = CRAGS.filter(c => c.r[0] === r.name).map(c => [c.la, c.lo] as [number, number]);
      if (pts.length < 3) return;
      const hull = convexHull(pts);
      const color = regionColorMap.get(r.name) || SAGE;
      const poly = Lib.polygon(hull, { color, weight: 1.5, opacity: 0.55, fillColor: color, fillOpacity: 0.09 });
      poly.bindTooltip(r.name, { permanent: true, direction: "center", className: "region-label", opacity: 0.85 });
      poly.on("click", (e: any) => { e.originalEvent?.stopPropagation?.(); setNearbyMode(false); setUserPos(null); setCrag(null); setRegion(r.name); });
      poly.addTo(regionLayer.current);
    });
  }, [ready, regions, regionColorMap, region, nearbyMode, crag]);

  // draw / update the "you are here" marker + radius circle
  useEffect(() => {
    if (!ready || !L.current || !geoLayer.current) return;
    const Lib = L.current;
    geoLayer.current.clearLayers();
    if (!userPos) return;
    Lib.marker([userPos.lat, userPos.lon], {
      icon: Lib.divIcon({ className: "", html: '<div class="vm-you"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
    }).addTo(geoLayer.current);
    Lib.circle([userPos.lat, userPos.lon], {
      radius: radiusKm * 1000, color: TERRA, weight: 1.5, fillColor: TERRA, fillOpacity: 0.07,
    }).addTo(geoLayer.current);
    if (nearbyMode) {
      map.current.setView([userPos.lat, userPos.lon], radiusKm > 60 ? 8 : radiusKm > 20 ? 10 : 12);
    }
  }, [ready, userPos, radiusKm, nearbyMode]);

  // redraw markers when the visible set changes
  useEffect(() => {
    if (!ready || !L.current || !layer.current) return;
    const Lib = L.current, lg = layer.current;
    lg.clearLayers();
    const pts: [number, number][] = [];
    visible.forEach(c => {
      pts.push([c.la, c.lo]);
      const mk = Lib.circleMarker([c.la, c.lo], {
        radius: c.db ? 6 : 5, weight: c.db ? 1.5 : 1, color: "#F2ECE0",
        fillColor: cragColor(c), fillOpacity: c.db ? 0.95 : 0.6,
      });
      mk.on("click", (e: any) => {
        e.originalEvent?.stopPropagation?.();
        if (!region && !nearbyMode && c.r[0]) setRegion(c.r[0]);
        setCrag(c);
        mk.bindPopup(popupHtml(c)).openPopup();
      });
      mk.addTo(lg);
    });
    // don't refit bounds once a deep link or a "near me" search has already framed the view
    if (pts.length && !nearbyMode && !(initialCragName && crag?.n === initialCragName)) {
      const b = Lib.latLngBounds(pts.concat([VIENNA]));
      map.current.fitBounds(b, { padding: [30, 30], maxZoom: 12 });
    }
  }, [ready, visible, region, nearbyMode]);

  function popupHtml(c: Crag) {
    const links: string[] = [];
    if (c.web) links.push(`<a href="${c.web}" target="_blank" rel="noopener">Website</a>`);
    if (c.topo) links.push(`<a href="${c.topo}" target="_blank" rel="noopener">Topo</a>`);
    if (c.osm) links.push(`<a href="https://www.openstreetmap.org/${c.osm}" target="_blank" rel="noopener">OSM</a>`);
    const rc = c.gbr || c.rc || 0;
    return `<strong>${c.n}</strong><br>${km(c.la, c.lo)} km from Wien · ${rc} routes<br>
      ${c.db ? "In guidebook" : "OSM extra"}<br>${links.join(" · ")}`;
  }

  function backFromRegionOrNearby() {
    if (nearbyMode) { setNearbyMode(false); setUserPos(null); } else { setRegion(null); }
  }

  async function replayStephansplatzApproach() {
    if (!ready || !L.current || !approachLayer.current || !map.current) return;
    if (approachTimer.current) window.clearInterval(approachTimer.current);
    const Lib = L.current;
    approachLayer.current.clearLayers();
    setApproachStatus("loading");
    let points: [number, number][] = [STEPHANSPLATZ, JAMMERWANDL];
    let overviewOnly = false;
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${STEPHANSPLATZ[1]},${STEPHANSPLATZ[0]};${JAMMERWANDL[1]},${JAMMERWANDL[0]}?overview=full&geometries=geojson`);
      const payload = await response.json();
      if (payload.code === "Ok" && payload.routes?.[0]?.geometry?.coordinates?.length) {
        points = payload.routes[0].geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]);
      } else {
        overviewOnly = true;
      }
    } catch {
      overviewOnly = true;
    }
    const sampleStep = Math.max(1, Math.ceil(points.length / 90));
    const sampled = points.filter((_, i) => i % sampleStep === 0 || i === points.length - 1);
    Lib.marker(STEPHANSPLATZ, { icon: Lib.divIcon({ className: "", html: '<div class="approach-pin">START</div>', iconSize: [48, 24], iconAnchor: [24, 12] }) }).addTo(approachLayer.current);
    Lib.marker(JAMMERWANDL, { icon: Lib.divIcon({ className: "", html: '<div class="approach-pin end">WALL</div>', iconSize: [42, 24], iconAnchor: [21, 12] }) }).addTo(approachLayer.current);
    Lib.polyline(sampled, { color: "#D89A34", weight: 2, opacity: 0.28 }).addTo(approachLayer.current);
    const progress = Lib.polyline([], { color: TERRA, weight: 4, opacity: 0.95 }).addTo(approachLayer.current);
    map.current.flyTo(STEPHANSPLATZ, 13, { duration: 0.8 });
    setApproachStatus("playing");
    let index = 1;
    approachTimer.current = window.setInterval(() => {
      progress.setLatLngs(sampled.slice(0, index));
      if (index % 8 === 0 && sampled[index]) map.current.panTo(sampled[index], { animate: true, duration: 0.25 });
      index += 1;
      if (index > sampled.length) {
        if (approachTimer.current) window.clearInterval(approachTimer.current);
        approachTimer.current = null;
        map.current.flyTo(JAMMERWANDL, 14, { duration: 0.9 });
        setApproachStatus(overviewOnly ? "overview" : "ready");
      }
    }, 40);
  }

  // panel
  let title = "REGIONS", back: (() => void) | null = null, count = "";
  if (crag) {
    title = crag.n.toUpperCase(); back = () => setCrag(null); count = `${crag.gbr || crag.rc} routes`;
  } else if (nearbyMode) {
    title = "NEAR YOU"; back = backFromRegionOrNearby; count = `${nearby.length} within ${radiusKm}km`;
  } else if (region) {
    title = region.toUpperCase(); back = () => setRegion(null); count = `${visible.length} crags`;
  } else {
    count = `${regions.length} regions`;
  }

  return (
    <div className={showPanel ? "mapgrid" : "map-only"}>
      <div className="mapcol">
        <div className="map-shell">
        <div id="map" ref={mapEl}>
          {err && <div style={{ padding: 20 }} className="muted">{err} The lists on the right still work.</div>}
        </div>
        <button className={`map-locate-control ${geoStatus === "locating" ? "locating" : ""}`} type="button" onClick={useMyLocation} aria-label="Use my location" title="Use my location">
          <span className="locate-dot" />
        </button>
        <div className="geo-cta map-finder" hidden>
          <button className="btn btn-terra" onClick={useMyLocation} disabled={geoStatus === "locating"}>
            {geoStatus === "locating" ? "Finding you…" : "Use my location"}
          </button>
          <div className="radius-control">
            <label htmlFor="radius-km"><span>Search radius</span><output>{radiusKm} km</output></label>
            <input id="radius-km" type="range" min="5" max="150" step="5" value={radiusKm} onChange={e => { setRadiusKm(Number(e.target.value)); if (userPos) setNearbyMode(true); }} />
            <div className="radius-scale"><span>5 km</span><span>50 km</span><span>100 km</span><span>150 km</span></div>
          </div>
          <Link href="/explore" className="map-search-link">Search routes &amp; crags</Link>
          {geoMessages[geoStatus] && (
            <div className="geo-error">
              {geoMessages[geoStatus]}
              <button className="chip" style={{ marginLeft: 10 }} onClick={useMyLocation}>Try again</button>
            </div>
          )}
        </div>
        <div className="map-toolbox">
          <button className={`map-tool approach-tool ${approachStatus === "playing" ? "on" : ""}`} type="button" onClick={replayStephansplatzApproach} disabled={approachStatus === "loading" || approachStatus === "playing"}>
            {approachStatus === "loading" ? "Loading approach" : approachStatus === "playing" ? "Flying from Stephansplatz" : "Replay from Stephansplatz"}
          </button>
          <button className={`map-tool ${measuring ? "on" : ""}`} type="button" onClick={() => { setMeasuring(v => !v); setMeasurePoints([]); }}>
            {measuring ? "Measuring: click two points" : "Measure distance"}
          </button>
          {measurePoints.length > 0 && <button className="map-tool" type="button" onClick={() => setMeasurePoints([])}>Clear</button>}
          <a className="map-tool" href="https://www.google.com/maps" target="_blank" rel="noopener">Open Google Maps</a>
          <a className="map-tool" href="https://mapy.com/" target="_blank" rel="noopener">Open Mapy.com</a>
        </div>
        {(approachStatus === "ready" || approachStatus === "overview") && <div className="approach-status">{approachStatus === "overview" ? "Beta overview from coordinates" : "Beta road replay ends at Jammerwandl"}</div>}
        </div>
      </div>
      {showPanel && <aside className="panel">
        <div className="panel-head">
          {back && <button className="crumb" onClick={back}>← Back</button>}
          <h2>{title}</h2>
          <span className="pcount">{count}</span>
        </div>
        <div className="plist">
          {crag ? (
            <CragRoutes crag={crag} />
          ) : nearbyMode ? (
            nearby.length === 0 ? (
              <div className="muted" style={{ padding: "14px 10px", color: "var(--sage)" }}>Nothing that close — try a wider radius.</div>
            ) : (
              nearby.map(c => (
                <button key={c.n} className="prow" onClick={() => { setCrag(c); map.current?.setView([c.la, c.lo], 13); }}>
                  <span className={`rdot ${c.db ? "g-dot" : "s-dot"}`} />
                  <span className="rname">{c.n}</span>
                  <span className="rmeta">{c.dist.toFixed(1)} km</span>
                </button>
              ))
            )
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
      </aside>}
    </div>
  );
}

function CragRoutes({ crag }: { crag: Crag }) {
  const links: React.ReactNode[] = [];
  if (crag.web) links.push(<a key="w" href={crag.web} target="_blank" rel="noopener" style={{ color: "var(--gold)" }}>Website</a>);
  if (crag.topo) links.push(<a key="t" href={crag.topo} target="_blank" rel="noopener" style={{ color: "var(--gold)" }}>Topo</a>);
  if (crag.osm) links.push(<a key="o" href={`https://www.openstreetmap.org/${crag.osm}`} target="_blank" rel="noopener" style={{ color: "var(--gold)" }}>OSM</a>);
  links.push(
    <a key="gm" href={`https://www.google.com/maps/search/?api=1&query=${crag.la},${crag.lo}`} target="_blank" rel="noopener" style={{ color: "var(--gold)" }}>
      Google Maps
    </a>
  );
  links.push(
    <a key="bs" href={`https://www.bergsteigen.com/?s=${encodeURIComponent(crag.n)}`} target="_blank" rel="noopener" style={{ color: "var(--gold)" }}>
      bergsteigen.com
    </a>
  );
  const model = MODELS.find(m => m.crag === crag.n);
  const regionLabel = crag.r[0] ?? "the region";
  return (
    <>
      <div style={{ padding: "2px 8px 10px", fontSize: 12.5, color: "var(--sage)" }}>
        {km(crag.la, crag.lo)} km from Wien · {crag.db ? "In guidebook" : "OSM extra"}
        <div style={{ marginTop: 6 }}>
          One of the crags in {regionLabel}. {crag.osm ? "Location sourced from OpenStreetMap." : ""}
        </div>
        {links.length > 0 && <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>{links}</div>}
      </div>
      <div style={{ padding: "0 8px" }}>
        <Link href={`/report?crag=${encodeURIComponent(crag.n)}`} className="btn btn-terra" style={{ width: "100%", marginBottom: 10 }}>
          Report from here
        </Link>
      </div>
      {model && (
        <div style={{ padding: "0 8px" }}>
          <Model3D glb={model.glb} alt={`3D scan of ${crag.n}`} webReady={model.webReady} note={model.note} />
        </div>
      )}
      {crag.routes.length ? (
        crag.routes.map((r, i) => (
          <a key={i} className="prow route route-weather" href={`https://www.windy.com/${crag.la}/${crag.lo}`} target="_blank" rel="noopener" title={`Open weather forecast for ${crag.n}`}>
            <span className={`rdot`} style={{ background: "var(--gold)" }} title={r.gp} />
            <span className="rname">{r.n}</span>
            <span className="rmeta g" style={{ color: "var(--chalk)" }}>{r.g}</span>
            <span className="weather-mark">Weather</span>
          </a>
        ))
      ) : (
        <div style={{ padding: 10, fontSize: 13, color: "var(--sage)" }}>
          No catalogued routes yet. This crag came from OpenStreetMap — a contributor mission can transcribe its routes.
        </div>
      )}
    </>
  );
}
