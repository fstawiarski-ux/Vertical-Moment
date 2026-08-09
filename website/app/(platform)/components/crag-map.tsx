"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Model3D } from "./model-3d";
import type { CragDetail, CragSummary, RegionSummary, RouteCard, RouteSearchEntry } from "../lib/climbing-types";
import { fetchAllCrags, fetchCragDetail, fetchRegionDetail, fetchRegions, fetchSearchIndex } from "../lib/climbing-client";
import { find3DModel } from "../lib/media";

const VIENNA: [number, number] = [48.2082, 16.3738];
const STEPHANSPLATZ: [number, number] = [48.2085, 16.3731];
const JAMMERWANDL: [number, number] = [48.015385, 16.198357];
const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
const GOLD = "#D89A34", SAGE = "#93A382", TERRA = "#BF6B4F";

function regionHue(index: number, total: number) {
  const hue = Math.round((index * 360) / Math.max(total, 1));
  return `hsl(${hue}, 60%, 46%)`;
}

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

/** Pin radius encodes route count — sqrt scale so 800-route Hohe Wand
 * doesn't dwarf everything, clamped so a stub is still clickable. */
function pinRadius(routeCount: number) {
  if (routeCount <= 0) return 4;
  return Math.max(5, Math.min(16, 4 + Math.sqrt(routeCount) * 1.1));
}
/** Pin colour is the entire legend: gold = has transcribed routes, sage =
 * OSM-only stub. Nothing else (not region) drives pin colour. */
function pinColor(c: { routeCount: number; isStub: boolean }) {
  return c.isStub || c.routeCount === 0 ? SAGE : GOLD;
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
    js.src = LEAFLET_JS; js.async = true; js.crossOrigin = "anonymous";
    js.onload = () => resolve((window as any).L);
    js.onerror = () => reject(new Error("Leaflet failed to load — check your connection."));
    document.head.appendChild(js);
  });
}

/** Builds a one-waypoint GPX file from the crag's own verified coordinate —
 * generated from data already in hand, never a fetched/fabricated URL. */
function cragGpx(c: CragSummary): string {
  const lat = c.latitude, lon = c.longitude;
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Vertical Moment" xmlns="http://www.topografix.com/GPX/1/1">
  <wpt lat="${lat}" lon="${lon}">
    <name>${c.name}</name>
    <desc>${c.regionName} — ${c.routeCount} routes. Coordinate source: ${c.coordSource ?? "unknown"}. © OpenStreetMap contributors.</desc>
  </wpt>
</gpx>`;
}
function downloadGpx(c: CragSummary) {
  const blob = new Blob([cragGpx(c)], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${c.slug}.gpx`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export function CragMap({ initialRegionSlug, initialCragSlug, showPanel = true }: { initialRegionSlug?: string; initialCragSlug?: string; showPanel?: boolean } = {}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const layer = useRef<any>(null);
  const geoLayer = useRef<any>(null);
  const viennaRings = useRef<any>(null);
  const measureLayer = useRef<any>(null);
  const approachLayer = useRef<any>(null);
  const approachTimer = useRef<number | null>(null);
  const regionLayer = useRef<any>(null);
  const markerBySlug = useRef<Map<string, any>>(new Map());
  const L = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [regions, setRegions] = useState<RegionSummary[]>([]);
  const [allCrags, setAllCrags] = useState<CragSummary[]>([]);
  const [region, setRegion] = useState<string | null>(initialRegionSlug ?? null); // region SLUG
  const [regionCrags, setRegionCrags] = useState<CragSummary[] | null>(null);
  const [crag, setCrag] = useState<CragDetail | CragSummary | null>(null);
  const deepLinkApplied = useRef(false);

  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "denied" | "timeout" | "unavailable" | "unsupported">("idle");
  const [nearbyMode, setNearbyMode] = useState(false);
  const [radiusKm, setRadiusKm] = useState(50);
  const [measuring, setMeasuring] = useState(false);
  const measuringRef = useRef(false);
  const [measurePoints, setMeasurePoints] = useState<{ lat: number; lon: number }[]>([]);
  const [approachStatus, setApproachStatus] = useState<"idle" | "loading" | "playing" | "ready" | "overview">("idle");

  // route-name + crag-name search, top level only
  const [query, setQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState<RouteSearchEntry[] | null>(null);

  const geoMessages: Record<string, string> = {
    denied: "Location permission was denied. Check your browser's site settings (and your phone's location services) and try again.",
    timeout: "Took too long to get a fix — weak GPS signal or a slow first request. Try again, ideally outdoors.",
    unavailable: "Your device couldn't determine a location right now. Try again in a moment.",
    unsupported: "This browser doesn't support location. Browse by region instead.",
  };

  // initial data: region index + full crag index (small; per-region/per-crag detail loads on demand)
  useEffect(() => {
    fetchRegions().then(setRegions).catch(e => setErr(e.message));
    fetchAllCrags().then(setAllCrags).catch(e => setErr(e.message));
  }, []);

  useEffect(() => {
    if (query.trim() && !searchIndex) {
      fetchSearchIndex().then(setSearchIndex).catch(() => {});
    }
  }, [query, searchIndex]);

  const regionColorMap = useMemo(() => {
    const m = new Map<string, string>();
    regions.forEach((r, i) => m.set(r.slug, regionHue(i, regions.length)));
    return m;
  }, [regions]);

  const nearby = useMemo(() => {
    if (!nearbyMode || !userPos) return [];
    return allCrags
      .filter(c => c.latitude != null && c.longitude != null)
      .map(c => ({ ...c, dist: distanceKm(userPos.lat, userPos.lon, c.latitude as number, c.longitude as number) }))
      .filter(c => c.dist <= radiusKm)
      .sort((a, b) => a.dist - b.dist);
  }, [nearbyMode, userPos, radiusKm, allCrags]);

  const visible = useMemo(() => {
    if (nearbyMode && userPos) return nearby;
    if (region && regionCrags) return regionCrags;
    return allCrags;
  }, [region, regionCrags, nearbyMode, userPos, nearby, allCrags]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { crags: [] as CragSummary[], routes: [] as RouteSearchEntry[] };
    const crags = allCrags.filter(c => c.name.toLowerCase().includes(q)).slice(0, 10);
    const routes = (searchIndex ?? []).filter(r => r.name.toLowerCase().includes(q)).slice(0, 10);
    return { crags, routes };
  }, [query, allCrags, searchIndex]);

  function useMyLocation() {
    if (!("geolocation" in navigator)) { setGeoStatus("unsupported"); return; }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserPos({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoStatus("idle");
        setNearbyMode(true);
        setRegion(null); setRegionCrags(null); setCrag(null);
      },
      (e) => {
        if (e.code === e.PERMISSION_DENIED) setGeoStatus("denied");
        else if (e.code === e.TIMEOUT) setGeoStatus("timeout");
        else setGeoStatus("unavailable");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    );
  }

  function openRegion(slug: string) {
    setNearbyMode(false); setUserPos(null); setCrag(null);
    setRegion(slug);
    setRegionCrags(null);
    fetchRegionDetail(slug).then(d => setRegionCrags(d.crags)).catch(e => setErr(e.message));
  }

  function openCrag(c: CragSummary) {
    setCrag(c); // show summary immediately, upgrade to full detail (routes) below
    if (!region && !nearbyMode) openRegion(c.regionSlug);
    map.current?.setView([c.latitude ?? VIENNA[0], c.longitude ?? VIENNA[1]], c.latitude != null ? 13 : 9);
    fetchCragDetail(c.regionSlug, c.slug).then(setCrag).catch(e => setErr(e.message));
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
          { maxZoom: 19, subdomains: "abcd", attribution: "&copy; OpenStreetMap contributors &copy; CARTO" }),
        Lib.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
          { maxZoom: 19, subdomains: "abcd", opacity: 0.85 }),
      ]);
      const terrain = Lib.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        maxZoom: 17, subdomains: "abc",
        attribution: "&copy; OpenStreetMap contributors &copy; OpenTopoMap (CC-BY-SA)",
      }).addTo(m);
      const satellite = Lib.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, attribution: "Tiles &copy; Esri" }
      );
      const streets = Lib.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: "&copy; OpenStreetMap contributors",
      });
      const explorer = Lib.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19, subdomains: "abcd", attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
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

  // Permanent distance reference from Vienna.
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

  useEffect(() => { measuringRef.current = measuring; }, [measuring]);

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

  // deep-link: open a specific region/crag on load
  useEffect(() => {
    if (!ready || deepLinkApplied.current) return;
    if (!initialRegionSlug) return;
    deepLinkApplied.current = true;
    openRegion(initialRegionSlug);
    if (initialCragSlug) {
      fetchCragDetail(initialRegionSlug, initialCragSlug).then(c => {
        setCrag(c);
        if (c.latitude != null) map.current?.setView([c.latitude, c.longitude as number], 13);
      }).catch(e => setErr(e.message));
    }
  }, [ready, initialRegionSlug, initialCragSlug]);

  // region overview shapes — cleared once drilled into a region/crag/nearby
  useEffect(() => {
    if (!ready || !L.current || !regionLayer.current) return;
    const Lib = L.current;
    regionLayer.current.clearLayers();
    if (region || nearbyMode || crag || !allCrags.length) return;
    regions.forEach(r => {
      const pts = allCrags.filter(c => c.regionSlug === r.slug && c.latitude != null)
        .map(c => [c.latitude as number, c.longitude as number] as [number, number]);
      if (pts.length < 3) return;
      const hull = convexHull(pts);
      const color = regionColorMap.get(r.slug) || SAGE;
      const poly = Lib.polygon(hull, { color, weight: 1.5, opacity: 0.55, fillColor: color, fillOpacity: 0.09 });
      poly.bindTooltip(r.name, { permanent: true, direction: "center", className: "region-label", opacity: 0.85 });
      poly.on("click", (e: any) => { e.originalEvent?.stopPropagation?.(); openRegion(r.slug); });
      poly.addTo(regionLayer.current);
    });
  }, [ready, regions, regionColorMap, region, nearbyMode, crag, allCrags]);

  // "you are here"
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

  // redraw markers when the visible set changes. Size = route count, colour
  // = catalogue state (gold/sage) — the entire legend. Only the selected
  // crag's marker gets a persistent label.
  useEffect(() => {
    if (!ready || !L.current || !layer.current) return;
    const Lib = L.current, lg = layer.current;
    lg.clearLayers();
    markerBySlug.current.clear();
    const pts: [number, number][] = [];
    visible.forEach(c => {
      if (c.latitude == null || c.longitude == null) return;
      pts.push([c.latitude, c.longitude]);
      const mk = Lib.circleMarker([c.latitude, c.longitude], {
        radius: pinRadius(c.routeCount), weight: c.isStub ? 1 : 1.5, color: "#F2ECE0",
        fillColor: pinColor(c), fillOpacity: c.isStub ? 0.65 : 0.95,
      });
      mk.on("click", (e: any) => { e.originalEvent?.stopPropagation?.(); openCrag(c); });
      mk.addTo(lg);
      markerBySlug.current.set(`${c.regionSlug}/${c.slug}`, mk);
    });
    if (pts.length && !nearbyMode && !crag) {
      const b = Lib.latLngBounds(pts.concat([VIENNA]));
      map.current.fitBounds(b, { padding: [30, 30], maxZoom: 12 });
    }
  }, [ready, visible, nearbyMode]);

  // label ONLY the selected pin
  useEffect(() => {
    if (!ready || !L.current) return;
    // unbindTooltip() is a safe no-op on a marker that never had one bound.
    // isTooltipOpen() is NOT safe to call first: Leaflet 1.9.4 reads
    // this._tooltip.isOpen() without null-checking _tooltip, so calling it
    // on any marker that's never had a tooltip throws and (in practice)
    // took the whole tab down with it.
    markerBySlug.current.forEach(mk => mk.unbindTooltip());
    if (!crag) return;
    const mk = markerBySlug.current.get(`${crag.regionSlug}/${crag.slug}`);
    if (mk) {
      mk.bindTooltip(crag.name, { permanent: true, direction: "top", offset: [0, -6], className: "selected-crag-label" });
      mk.openTooltip();
    }
  }, [ready, crag]);

  function backFromRegionOrNearby() {
    if (nearbyMode) { setNearbyMode(false); setUserPos(null); } else { setRegion(null); setRegionCrags(null); }
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

  // panel: one panel, three depths (regions -> crags -> one crag), back + breadcrumb always present
  let title = "REGIONS", back: (() => void) | null = null, count = "";
  if (crag) {
    title = crag.name.toUpperCase(); back = () => setCrag(null); count = `${crag.routeCount} routes`;
  } else if (nearbyMode) {
    title = "NEAR YOU"; back = backFromRegionOrNearby; count = `${nearby.length} within ${radiusKm}km`;
  } else if (region) {
    const r = regions.find(x => x.slug === region);
    title = (r?.name ?? region).toUpperCase(); back = backFromRegionOrNearby; count = `${(regionCrags ?? []).length} crags`;
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
        </div>
        {(approachStatus === "ready" || approachStatus === "overview") && <div className="approach-status">{approachStatus === "overview" ? "Beta overview from coordinates" : "Beta road replay ends at Jammerwandl"}</div>}
        <div className="map-attribution-note">© OpenStreetMap contributors</div>
        </div>
      </div>
      {showPanel && <aside className="panel">
        <div className="panel-head">
          {back && <button className="crumb" onClick={back}>← Back</button>}
          <h2>{title}</h2>
          <span className="pcount">{count}</span>
        </div>
        {!crag && !nearbyMode && (
          <div style={{ padding: "0 8px 8px" }}>
            <input
              className="search" style={{ width: "100%" }}
              placeholder="Search a crag or route name…"
              value={query} onChange={e => setQuery(e.target.value)}
              aria-label="Search crags and routes"
            />
          </div>
        )}
        <div className="plist">
          {query.trim() && !crag && !nearbyMode ? (
            <SearchResults query={query} results={searchResults} onPickCrag={c => { setQuery(""); openCrag(c); }} />
          ) : crag ? (
            "routes" in crag ? <CragDetailPanel crag={crag as CragDetail} /> : <div className="muted" style={{ padding: 14 }}>Loading…</div>
          ) : nearbyMode ? (
            nearby.length === 0 ? (
              <div className="muted" style={{ padding: "14px 10px", color: "var(--sage)" }}>Nothing that close — try a wider radius.</div>
            ) : (
              nearby.map(c => (
                <button key={`${c.regionSlug}/${c.slug}`} className="prow" onClick={() => openCrag(c)}>
                  <span className={`rdot ${c.isStub ? "s-dot" : "g-dot"}`} />
                  <span className="rname">{c.name}</span>
                  <span className="rmeta">{c.dist.toFixed(1)} km</span>
                </button>
              ))
            )
          ) : region ? (
            (regionCrags ?? []).map(c => (
              <button key={c.slug} className="prow" onClick={() => openCrag(c)}>
                <span className={`rdot ${c.isStub ? "s-dot" : "g-dot"}`} />
                <span className="rname">{c.name}</span>
                <span className="rmeta">{c.routeCount ? `${c.routeCount} rt` : "—"}</span>
              </button>
            ))
          ) : (
            regions.map(r => (
              <button key={r.slug} className="prow" onClick={() => openRegion(r.slug)}>
                <span className="rname">{r.name}</span>
                <span className="rmeta">{r.cragCount} crags · {r.routeCount} rt</span>
              </button>
            ))
          )}
        </div>
      </aside>}
    </div>
  );
}

function SearchResults({ results, onPickCrag }: { query: string; results: { crags: CragSummary[]; routes: RouteSearchEntry[] }; onPickCrag: (c: CragSummary) => void }) {
  if (!results.crags.length && !results.routes.length) {
    return <div className="muted" style={{ padding: "14px 10px", color: "var(--sage)" }}>No matches.</div>;
  }
  return (
    <>
      {results.crags.length > 0 && (
        <>
          <div className="search-group-label">Crags</div>
          {results.crags.map(c => (
            <button key={`c-${c.regionSlug}/${c.slug}`} className="prow" onClick={() => onPickCrag(c)}>
              <span className={`rdot ${c.isStub ? "s-dot" : "g-dot"}`} />
              <span className="rname">{c.name}</span>
              <span className="rmeta">{c.regionName}</span>
            </button>
          ))}
        </>
      )}
      {results.routes.length > 0 && (
        <>
          <div className="search-group-label">Routes</div>
          {results.routes.map(r => (
            <Link key={`r-${r.id}`} href={r.path} className="prow">
              <span className="rdot" style={{ background: "var(--gold)" }} />
              <span className="rname">{r.name}</span>
              <span className="rmeta">{r.grade ?? ""} · {r.cragName}</span>
            </Link>
          ))}
        </>
      )}
    </>
  );
}

function CragDetailPanel({ crag }: { crag: CragDetail }) {
  const ROUTE_PREVIEW = 8;
  const [showAll, setShowAll] = useState(false);
  const model = find3DModel(crag.name);
  const shown = showAll ? crag.routes : crag.routes.slice(0, ROUTE_PREVIEW);
  const remaining = crag.routes.length - shown.length;

  return (
    <>
      <div style={{ padding: "2px 8px 10px", fontSize: 12.5, color: "var(--sage)" }}>
        {crag.distanceFromViennaKm != null ? `${crag.distanceFromViennaKm} km from Wien · ` : ""}
        {crag.routeCount} route{crag.routeCount === 1 ? "" : "s"}
        {crag.gradeSpan && ` · ${crag.gradeSpan.min}–${crag.gradeSpan.max}`}
        {crag.isStub && <div style={{ marginTop: 6 }}>Not catalogued yet. This crag came from OpenStreetMap — a contributor mission can transcribe its routes.</div>}
      </div>

      <div className="crag-actions" style={{ display: "flex", gap: 8, padding: "0 8px 10px", flexWrap: "wrap" }}>
        {crag.latitude != null && (
          <a className="btn btn-terra" href={`https://www.google.com/maps/search/?api=1&query=${crag.latitude},${crag.longitude}`} target="_blank" rel="noopener">Maps</a>
        )}
        {crag.latitude != null && (
          <button className="btn btn-terra" type="button" onClick={() => downloadGpx(crag)}>GPX</button>
        )}
        <button className="btn btn-terra" type="button" disabled={!crag.media.photos} title={crag.media.photos ? undefined : "No photos catalogued for this crag yet"}>
          Photos
        </button>
      </div>

      {model && (
        <div style={{ padding: "0 8px 10px" }}>
          <Model3D glb={model.glb} alt={`3D scan of ${crag.name}`} webReady={model.webReady} note={model.note} />
        </div>
      )}

      {crag.routes.length ? (
        <>
          {shown.map(r => (
            <a key={r.id} id={r.id} className="prow route" href={r.path}>
              <span className="rdot" style={{ background: "var(--gold)" }} />
              <span className="rname">{r.name}</span>
              <span className="rmeta g" style={{ color: "var(--chalk)" }}>{r.grade ?? "—"}</span>
              {r.verificationStatus === "imported-unverified" && <span className="unverified-badge" title="Imported, not yet verified on site">unverified</span>}
            </a>
          ))}
          {!showAll && remaining > 0 && (
            <button className="prow" style={{ justifyContent: "center", color: "var(--gold)" }} onClick={() => setShowAll(true)}>
              + {remaining} more
            </button>
          )}
          {crag.routes.some(r => r.verificationStatus === "imported-unverified") && (
            <div className="verify-disclaimer" style={{ padding: "8px 10px", fontSize: 11.5, color: "var(--sage)" }}>
              Imported from source data, not yet independently verified. Grades, names and positions may be wrong — check on site before you commit to anything.
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: 10, fontSize: 13, color: "var(--sage)" }}>
          No catalogued routes yet.
        </div>
      )}

      <MoreInformation crag={crag} />
    </>
  );
}

function MoreInformation({ crag }: { crag: CragDetail }) {
  if (!crag.links.length) return null;
  const exact = crag.links.filter(l => l.kind === "exact");
  const search = crag.links.filter(l => l.kind === "search");
  return (
    <div className="more-info" style={{ padding: "10px 8px", borderTop: "1px solid var(--line-2, #38493D)", marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--chalk)", marginBottom: 6 }}>More information</div>
      {[...exact, ...search].map((l, i) => (
        <a key={i} href={l.url} target="_blank" rel="noopener" style={{ display: "block", fontSize: 12.5, color: "var(--gold)", marginBottom: 4 }} title={l.note ?? undefined}>
          {l.label}{l.kind === "search" ? " (search)" : ""}
        </a>
      ))}
      <p style={{ fontSize: 11.5, color: "var(--sage)", marginTop: 8 }}>
        No topos here yet — these sites have them. Verify bolts on site.
      </p>
      <p style={{ fontSize: 11, color: "var(--sage)", marginTop: 4 }}>© OpenStreetMap contributors</p>
    </div>
  );
}
