"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import atlasJson from "../../../app/(platform)/explore/atlas-data.json";
import styles from "./BoxCragLocator.module.css";

type AtlasRegion = {
  n: string;
  ct: number;
  ok: number;
  tbf: number;
  lat: number;
  lon: number;
};

type AtlasWall = {
  id: string;
  n: string;
  rg: string;
  ct: number;
  ok: number;
  tbf: number;
  lat: number | null;
  lon: number | null;
  gr: string[];
  gpx: string | null;
};

type AtlasRoute = {
  n: string;
  g: string;
  rg: string;
  w: string;
};

type AtlasData = {
  generated: string;
  regions: AtlasRegion[];
  walls: AtlasWall[];
  routes: AtlasRoute[];
  source: {
    regionCount: number;
    wallCount: number;
    routeCount: number;
    gpxCount: number;
  };
};

type SearchHit =
  | { kind: "region"; label: string; meta: string; region: string }
  | { kind: "wall"; label: string; meta: string; region: string; wallId: string }
  | { kind: "route"; label: string; meta: string; region: string; wallId: string };

type BaseLayerKey = "terrain" | "streets" | "satellite" | "light";
type LatLon = [number, number];

declare global {
  interface Window {
    L?: any;
  }
}

const ATLAS = atlasJson as AtlasData;
const VIENNA: LatLon = [48.2082, 16.3738];
const DEFAULT_CENTER: LatLon = [47.94, 16.08];
const REGION_COLORS = [
  "#55a8db", "#de8b55", "#8bab65", "#d9ac50", "#75a57a", "#62aaa4",
  "#af8ac6", "#8fa3cb", "#cf8177", "#5c91a0", "#bd9864", "#899b65",
];

const BASE_LAYERS: Array<{ id: BaseLayerKey; label: string }> = [
  { id: "terrain", label: "Terrain" },
  { id: "streets", label: "Streets" },
  { id: "satellite", label: "Satellite" },
  { id: "light", label: "Light" },
];

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  const existing = document.querySelector<HTMLScriptElement>('script[data-vm-leaflet="true"]');
  if (existing) {
    return new Promise<any>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(window.L), { once: true });
      existing.addEventListener("error", () => reject(new Error("Leaflet failed to load")), { once: true });
    });
  }

  if (!document.querySelector('link[data-vm-leaflet="true"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/vendor/leaflet/leaflet.css";
    link.dataset.vmLeaflet = "true";
    document.head.appendChild(link);
  }

  return new Promise<any>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/vendor/leaflet/leaflet.js";
    script.dataset.vmLeaflet = "true";
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Leaflet failed to load"));
    document.head.appendChild(script);
  });
}

function distanceKm(origin: LatLon, destination: LatLon) {
  const radians = (value: number) => value * Math.PI / 180;
  const deltaLat = radians(destination[0] - origin[0]);
  const deltaLon = radians(destination[1] - origin[1]);
  const latA = radians(origin[0]);
  const latB = radians(destination[0]);
  const haversine = Math.sin(deltaLat / 2) ** 2
    + Math.cos(latA) * Math.cos(latB) * Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function colorForRegion(name: string) {
  const index = Math.max(0, ATLAS.regions.findIndex((region) => region.n === name));
  return REGION_COLORS[index % REGION_COLORS.length];
}

export default function BoxCragLocator() {
  const rootRef = useRef<HTMLDivElement>(null);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const baseLayersRef = useRef<Record<BaseLayerKey, any> | null>(null);
  const regionLayerRef = useRef<any>(null);
  const wallLayerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [online, setOnline] = useState(true);
  const [activeLayer, setActiveLayer] = useState<BaseLayerKey>("terrain");
  const [selectedRegion, setSelectedRegion] = useState("Peilstein");
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const regionWalls = useMemo(() => {
    const grouped = new Map<string, AtlasWall[]>();
    for (const region of ATLAS.regions) grouped.set(region.n, []);
    for (const wall of ATLAS.walls) grouped.get(wall.rg)?.push(wall);
    for (const walls of grouped.values()) walls.sort((a, b) => b.ct - a.ct || a.n.localeCompare(b.n));
    return grouped;
  }, []);

  const routesByWall = useMemo(() => {
    const wallByKey = new Map(ATLAS.walls.map((wall) => [`${wall.rg}\u0000${wall.n}`, wall]));
    const grouped = new Map<string, AtlasRoute[]>();
    for (const wall of ATLAS.walls) grouped.set(wall.id, []);
    for (const route of ATLAS.routes) {
      const wall = wallByKey.get(`${route.rg}\u0000${route.w}`);
      if (wall) grouped.get(wall.id)?.push(route);
    }
    return grouped;
  }, []);

  const orderedRegions = useMemo(
    () => [...ATLAS.regions].sort((a, b) => b.ct - a.ct || a.n.localeCompare(b.n)),
    [],
  );

  const selectedWall = useMemo(
    () => ATLAS.walls.find((wall) => wall.id === selectedWallId) ?? null,
    [selectedWallId],
  );

  const selectedRegionData = useMemo(
    () => ATLAS.regions.find((region) => region.n === selectedRegion) ?? ATLAS.regions[0],
    [selectedRegion],
  );

  const selectedTarget = useMemo(() => {
    if (selectedWall?.lat != null && selectedWall.lon != null) {
      return { label: selectedWall.n, coordinates: [selectedWall.lat, selectedWall.lon] as LatLon, zoom: 13 };
    }
    return {
      label: selectedRegionData.n,
      coordinates: [selectedRegionData.lat, selectedRegionData.lon] as LatLon,
      zoom: 10.5,
    };
  }, [selectedRegionData, selectedWall]);

  const focusMap = useCallback((regionName: string, wall?: AtlasWall | null) => {
    const map = mapRef.current;
    if (!map) return;
    if (wall?.lat != null && wall.lon != null) {
      map.flyTo([wall.lat, wall.lon], 13, { duration: 0.55 });
      return;
    }
    const points = (regionWalls.get(regionName) ?? [])
      .filter((item) => item.lat != null && item.lon != null)
      .map((item) => [item.lat as number, item.lon as number]);
    if (points.length > 1) map.flyToBounds(points, { padding: [38, 38], maxZoom: 11, duration: 0.55 });
    else {
      const region = ATLAS.regions.find((item) => item.n === regionName);
      if (region) map.flyTo([region.lat, region.lon], 11, { duration: 0.55 });
    }
  }, [regionWalls]);

  const chooseRegion = useCallback((regionName: string) => {
    setSelectedRegion(regionName);
    setSelectedWallId(null);
    window.setTimeout(() => focusMap(regionName), 0);
  }, [focusMap]);

  const chooseWall = useCallback((wall: AtlasWall) => {
    setSelectedRegion(wall.rg);
    setSelectedWallId(wall.id);
    window.setTimeout(() => focusMap(wall.rg, wall), 0);
  }, [focusMap]);

  useEffect(() => {
    const updateNetworkState = () => setOnline(navigator.onLine);
    updateNetworkState();
    window.addEventListener("online", updateNetworkState);
    window.addEventListener("offline", updateNetworkState);
    return () => {
      window.removeEventListener("online", updateNetworkState);
      window.removeEventListener("offline", updateNetworkState);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapElementRef.current || mapRef.current) return;
        const map = L.map(mapElementRef.current, {
          zoomControl: true,
          zoomSnap: 0.25,
          minZoom: 5,
          preferCanvas: true,
        }).setView(DEFAULT_CENTER, 9.5);
        const layers: Record<BaseLayerKey, any> = {
          terrain: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
            maxZoom: 17,
            attribution: "OpenStreetMap / OpenTopoMap",
          }),
          streets: L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "OpenStreetMap",
          }),
          satellite: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            maxZoom: 19,
            attribution: "Esri",
          }),
          light: L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
            maxZoom: 20,
            subdomains: "abcd",
            attribution: "OpenStreetMap / CARTO",
          }),
        };
        layers.terrain.addTo(map);
        baseLayersRef.current = layers;
        mapRef.current = map;
        regionLayerRef.current = L.layerGroup().addTo(map);
        wallLayerRef.current = L.layerGroup().addTo(map);
        setMapReady(true);
      })
      .catch(() => setMapError("The live map is unavailable. Region and route data still work offline."));

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      baseLayersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layers = baseLayersRef.current;
    if (!mapReady || !map || !layers) return;
    for (const layer of Object.values(layers)) if (map.hasLayer(layer)) map.removeLayer(layer);
    layers[activeLayer].addTo(map);
  }, [activeLayer, mapReady]);

  useEffect(() => {
    if (!mapReady || !window.L || !regionLayerRef.current || !wallLayerRef.current) return;
    const L = window.L;
    regionLayerRef.current.clearLayers();
    wallLayerRef.current.clearLayers();

    for (const region of ATLAS.regions) {
      const active = region.n === selectedRegion;
      const color = colorForRegion(region.n);
      const marker = L.circle([region.lat, region.lon], {
        radius: Math.max(4200, Math.min(12500, 2800 + region.ct * 22)),
        color,
        fillColor: color,
        fillOpacity: active ? 0.34 : 0.14,
        opacity: active ? 1 : 0.62,
        weight: active ? 3 : 1.4,
      });
      marker.bindTooltip(`${region.n} · ${region.ct} routes`, {
        permanent: active,
        direction: "center",
        className: styles.regionLabel,
      });
      marker.on("click", () => chooseRegion(region.n));
      marker.addTo(regionLayerRef.current);
    }

    for (const wall of regionWalls.get(selectedRegion) ?? []) {
      if (wall.lat == null || wall.lon == null) continue;
      const active = wall.id === selectedWallId;
      const marker = L.circleMarker([wall.lat, wall.lon], {
        radius: active ? 7 : 4.5,
        color: "#f7f1df",
        fillColor: colorForRegion(wall.rg),
        fillOpacity: 0.96,
        weight: active ? 2.5 : 1.2,
      });
      marker.bindTooltip(`${wall.n} · ${wall.ct} routes`, { direction: "top" });
      marker.on("click", () => chooseWall(wall));
      marker.addTo(wallLayerRef.current);
    }
  }, [chooseRegion, chooseWall, mapReady, regionWalls, selectedRegion, selectedWallId]);

  useEffect(() => {
    const root = rootRef.current;
    const map = mapRef.current;
    if (!root || !mapReady || !map) return;
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(root);
    const timer = window.setTimeout(() => map.invalidateSize({ pan: false }), 200);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [mapReady]);

  const searchHits = useMemo<SearchHit[]>(() => {
    const value = query.trim().toLocaleLowerCase();
    if (value.length < 2) return [];
    const regions: SearchHit[] = ATLAS.regions
      .filter((region) => region.n.toLocaleLowerCase().includes(value))
      .slice(0, 3)
      .map((region) => ({
        kind: "region",
        label: region.n,
        meta: `${regionWalls.get(region.n)?.length ?? 0} crags · ${region.ct} routes`,
        region: region.n,
      }));
    const walls: SearchHit[] = ATLAS.walls
      .filter((wall) => wall.n.toLocaleLowerCase().includes(value))
      .slice(0, 4)
      .map((wall) => ({ kind: "wall", label: wall.n, meta: `${wall.rg} · ${wall.ct} routes`, region: wall.rg, wallId: wall.id }));
    const routes: SearchHit[] = ATLAS.routes
      .filter((route) => route.n.toLocaleLowerCase().includes(value))
      .slice(0, 4)
      .map((route) => {
        const wall = ATLAS.walls.find((candidate) => candidate.rg === route.rg && candidate.n === route.w);
        return {
          kind: "route",
          label: route.n,
          meta: `${route.g || "grade pending"} · ${route.w}`,
          region: route.rg,
          wallId: wall?.id ?? "",
        };
      });
    return [...regions, ...walls, ...routes].slice(0, 8);
  }, [query, regionWalls]);

  function openSearchHit(hit: SearchHit) {
    if (hit.kind === "region") chooseRegion(hit.region);
    else {
      const wall = ATLAS.walls.find((candidate) => candidate.id === hit.wallId);
      if (wall) chooseWall(wall);
    }
    setQuery("");
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(VIENNA.join(","))}&destination=${encodeURIComponent(selectedTarget.coordinates.join(","))}`;
  const selectedRoutes = selectedWall ? routesByWall.get(selectedWall.id) ?? [] : [];
  const selectedWalls = regionWalls.get(selectedRegion) ?? [];

  return (
    <div ref={rootRef} className={styles.locator}>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span>Find a region, crag or route</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search 2,314 routes…"
            autoComplete="off"
          />
        </label>
        <label className={styles.layerPicker}>
          <span>Map</span>
          <select value={activeLayer} onChange={(event) => setActiveLayer(event.target.value as BaseLayerKey)}>
            {BASE_LAYERS.map((layer) => <option value={layer.id} key={layer.id}>{layer.label}</option>)}
          </select>
        </label>
        <a href={directionsUrl} target="_blank" rel="noreferrer">Directions</a>
        <span className={online ? styles.online : styles.offline}>{online ? "Live tiles" : "Cached tiles"}</span>
      </div>

      {query.trim().length >= 2 && (
        <div className={styles.searchResults} role="listbox" aria-label="Atlas search results">
          {searchHits.length ? searchHits.map((hit, index) => (
            <button key={`${hit.kind}-${hit.label}-${index}`} type="button" onClick={() => openSearchHit(hit)}>
              <strong>{hit.label}</strong><small>{hit.meta}</small>
            </button>
          )) : <p>No matching region, crag or route.</p>}
        </div>
      )}

      <nav className={styles.regionStrip} aria-label="Climbing regions">
        {orderedRegions.map((region) => (
          <button
            type="button"
            key={region.n}
            aria-pressed={region.n === selectedRegion}
            onClick={() => chooseRegion(region.n)}
          >
            <span>{region.n}</span><small>{region.ct}</small>
          </button>
        ))}
      </nav>

      <div className={styles.workspace}>
        <div className={styles.mapPane}>
          <div ref={mapElementRef} className={styles.map} aria-label="Map of climbing regions and crags" />
          {!mapReady && !mapError && <div className={styles.mapStatus}>Preparing the atlas…</div>}
          {mapError && <div className={styles.mapStatus}>{mapError}</div>}
          <div className={styles.mapCaption}>
            <strong>{selectedTarget.label}</strong>
            <span>{distanceKm(VIENNA, selectedTarget.coordinates).toFixed(1)} km from Vienna · Atlas {ATLAS.generated}</span>
          </div>
        </div>

        <aside className={styles.detail} aria-label="Selected atlas content">
          {selectedWall ? (
            <>
              <button className={styles.back} type="button" onClick={() => setSelectedWallId(null)}>← {selectedRegion} crags</button>
              <small>Crag</small>
              <h3>{selectedWall.n}</h3>
              <dl>
                <div><dt>Routes</dt><dd>{selectedWall.ct}</dd></div>
                <div><dt>GPS</dt><dd>{selectedWall.ok}</dd></div>
                <div><dt>Grades</dt><dd>{selectedWall.gr.slice(0, 4).join(", ") || "collecting"}</dd></div>
              </dl>
              <div className={styles.detailActions}>
                <button type="button" onClick={() => focusMap(selectedWall.rg, selectedWall)}>Focus map</button>
                <a href={directionsUrl} target="_blank" rel="noreferrer">Open directions</a>
                {selectedWall.gpx && <a href={selectedWall.gpx} download>GPX</a>}
              </div>
              <div className={styles.routeList} aria-label={`${selectedWall.n} route list`}>
                {selectedRoutes.slice(0, 60).map((route, index) => (
                  <div key={`${route.n}-${index}`}><span>{route.n}</span><strong>{route.g || "—"}</strong></div>
                ))}
                {!selectedRoutes.length && <p>No individual route rows supplied.</p>}
              </div>
            </>
           ) : (
             <>
               <small>Region summary · {selectedWalls.length} crags</small>
               <h3>{selectedRegion}</h3>
               <p>{selectedRegionData.ct} routes · {selectedRegionData.ok} mapped · {selectedRegionData.tbf} pending</p>
               <dl className={styles.regionStats}>
                 <div><dt>Crags</dt><dd>{selectedWalls.length}</dd></div>
                 <div><dt>Mapped routes</dt><dd>{selectedRegionData.ok}</dd></div>
                 <div><dt>Pending review</dt><dd>{selectedRegionData.tbf}</dd></div>
               </dl>
               <div className={styles.detailHeading}>
                 <strong>Available crags</strong>
                 <small>{selectedWalls.length ? "Select one to inspect" : "No crags listed"}</small>
               </div>
               <div className={styles.wallList}>
                 {selectedWalls.map((wall) => (
                   <button type="button" key={wall.id} onClick={() => chooseWall(wall)}>
                    <span>{wall.n}</span>
                    <small>{wall.ct} routes{wall.gpx ? " · GPX" : ""}</small>
                   </button>
                 ))}
               </div>
               <div className={styles.detailNote}>
                 <span>Field review status</span>
                 <p>Route geometry and pending rows remain provisional until their source is reviewed.</p>
               </div>
             </>
           )}
        </aside>
      </div>

      <footer className={styles.footer}>
        <span>{ATLAS.source.regionCount} regions</span>
        <span>{ATLAS.source.wallCount} crags</span>
        <span>{ATLAS.source.routeCount.toLocaleString("en")} routes</span>
        <span>{ATLAS.source.gpxCount} GPX</span>
      </footer>
    </div>
  );
}
