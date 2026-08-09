"use client";

import Link from "next/link";
import {
  ArrowSquareOut,
  ArrowsIn,
  ArrowsOut,
  MapTrifold,
  NavigationArrow,
  Ruler,
} from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import atlasJson from "./atlas-data.json";
import styles from "./explore-atlas.module.css";

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
  b: string;
  rg: string;
  w: string;
  src: string;
  st: number;
  lat?: number;
  lon?: number;
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
    matchedGpxCount: number;
  };
};

type SearchHit =
  | { kind: "region"; label: string; meta: string; region: string }
  | { kind: "wall"; label: string; meta: string; region: string; wallId: string }
  | { kind: "route"; label: string; meta: string; region: string; wallId: string };

type LatLon = [number, number];
type BaseLayerKey = "terrain" | "satellite" | "streets" | "light" | "mapbox";

declare global {
  interface Window {
    L?: any;
  }
}

const ATLAS = atlasJson as AtlasData;
const VIENNA_BELT_CENTER: LatLon = [47.94, 16.08];
const VIENNA_CITY_CENTER: LatLon = [48.2082, 16.3738];
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const BASE_LAYER_OPTIONS: Array<{ id: BaseLayerKey; label: string; hint: string }> = [
  { id: "terrain", label: "Terrain", hint: "Contours + trails" },
  { id: "satellite", label: "Satellite", hint: "Aerial context" },
  { id: "streets", label: "OSM Streets", hint: "Roads + places" },
  { id: "light", label: "Light", hint: "Clear labels" },
  ...(MAPBOX_TOKEN ? [{ id: "mapbox" as const, label: "Mapbox", hint: "Mapbox Streets" }] : []),
];

const REGION_ORDER = [
  "Hohe Wand",
  "Mödling",
  "Kaltenleutgebner Tal",
  "Peilstein",
  "Helenental",
  "Fischauer Vorberge",
  "Piestingtal",
  "Puchberg",
  "Puchberg Grünbach",
  "Lindkogel",
  "Bucklige Welt",
  "Adlitzgraeben",
  "Hoellental",
  "Höllental-Rax",
  "Rax i Schneeberg",
  "Neunkirchen",
];

const REGION_COLORS = [
  "#4e91c8",
  "#d07745",
  "#77975d",
  "#d3a13c",
  "#6d9b72",
  "#5b9f9a",
  "#a57cbd",
  "#8f9fc3",
  "#c67b72",
  "#4f8796",
  "#b18d58",
  "#7c8f59",
  "#8a6f62",
  "#8f789e",
  "#5e7795",
  "#a98364",
  "#638b75",
  "#9b7958",
  "#588a9a",
  "#98985a",
  "#8275a3",
  "#b0785e",
  "#648497",
  "#8b8d68",
  "#6c8b70",
  "#9b746f",
];

const REGION_IMAGES: Record<string, string> = {
  "Hohe Wand": "/photography/gallery/vm-7073-steep-ground.webp",
  Mödling: "/photography/gallery/vm-6913-traverse-morning-light.webp",
  Peilstein: "/photography/gallery/vm-7010-the-pit-afternoon.webp",
  Helenental: "/photography/gallery/vm-6578-ost-face.webp",
  Lindkogel: "/photography/gallery/vm-6890-peilstein-main-face.webp",
  "Kaltenleutgebner Tal": "/photography/gallery/vm-7303-belay-talk.webp",
  "Fischauer Vorberge": "/photography/gallery/vm-6693-high-on-the-pillar.webp",
};

const ARCHIVE_IMAGE_POOL = [
  "/photography/gallery/vm-6890-peilstein-main-face.webp",
  "/photography/gallery/vm-7029-the-cave-sector.webp",
  "/photography/gallery/vm-6918-full-extension.webp",
  "/photography/gallery/vm-6578-ost-face.webp",
  "/photography/gallery/vm-6683-green-corner.webp",
  "/photography/gallery/vm-6537-two-on-the-wall.webp",
];

const LANDING_LABELS = new Set([
  "Hohe Wand",
  "Mödling",
  "Kaltenleutgebner Tal",
  "Peilstein",
  "Helenental",
  "Fischauer Vorberge",
  "Piestingtal",
  "Puchberg",
  "Bucklige Welt",
  "Hoellental",
]);

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function regionColor(name: string) {
  const index = ATLAS.regions.findIndex((region) => region.n === name);
  return REGION_COLORS[Math.max(index, 0) % REGION_COLORS.length];
}

function regionImage(name: string, index: number) {
  return REGION_IMAGES[name] ?? ARCHIVE_IMAGE_POOL[index % ARCHIVE_IMAGE_POOL.length];
}

function distanceKm(origin: LatLon, destination: LatLon) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLatitude = radians(destination[0] - origin[0]);
  const deltaLongitude = radians(destination[1] - origin[1]);
  const latitudeA = radians(origin[0]);
  const latitudeB = radians(destination[0]);
  const haversine = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(deltaLongitude / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function cross(origin: [number, number], a: [number, number], b: [number, number]) {
  return (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0]);
}

function coverageHull(points: LatLon[]): LatLon[] {
  const unique = Array.from(new Map(points.map(([lat, lon]) => [`${lat}:${lon}`, [lon, lat] as [number, number]])).values());
  if (unique.length < 3) return [];
  unique.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const lower: [number, number][] = [];
  for (const point of unique) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
    lower.push(point);
  }
  const upper: [number, number][] = [];
  for (let index = unique.length - 1; index >= 0; index -= 1) {
    const point = unique[index];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
    upper.push(point);
  }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  const centerLon = hull.reduce((sum, point) => sum + point[0], 0) / hull.length;
  const centerLat = hull.reduce((sum, point) => sum + point[1], 0) / hull.length;
  return hull.map(([lon, lat]) => [centerLat + (lat - centerLat) * 1.14, centerLon + (lon - centerLon) * 1.14]);
}

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

export default function ExploreAtlasExperience() {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const baseLayersRef = useRef<Record<string, any>>({});
  const regionLayersRef = useRef<any>(null);
  const pinLayersRef = useRef<any>(null);
  const distanceLayerRef = useRef<any>(null);
  const flybyTimerRef = useRef<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [activeBaseLayer, setActiveBaseLayer] = useState<BaseLayerKey>("terrain");
  const [layerMenuOpen, setLayerMenuOpen] = useState(true);
  const [mapMinimized, setMapMinimized] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("Peilstein");
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [qaScale, setQaScale] = useState(false);

  useEffect(() => {
    setQaScale(new URLSearchParams(window.location.search).has("qa-scale"));
    if (window.matchMedia("(max-width: 760px)").matches) setLayerMenuOpen(false);
  }, []);

  const regionWalls = useMemo(() => {
    const grouped = new Map<string, AtlasWall[]>();
    for (const region of ATLAS.regions) grouped.set(region.n, []);
    for (const wall of ATLAS.walls) grouped.get(wall.rg)?.push(wall);
    for (const walls of grouped.values()) walls.sort((a, b) => b.ct - a.ct || a.n.localeCompare(b.n));
    return grouped;
  }, []);

  const routesByWall = useMemo(() => {
    const grouped = new Map<string, AtlasRoute[]>();
    for (const wall of ATLAS.walls) grouped.set(wall.id, []);
    for (const route of ATLAS.routes) {
      const wall = ATLAS.walls.find((candidate) => candidate.rg === route.rg && candidate.n === route.w);
      if (wall) grouped.get(wall.id)?.push(route);
    }
    return grouped;
  }, []);

  const orderedRegions = useMemo(() => {
    const rank = new Map(REGION_ORDER.map((name, index) => [name, index]));
    return [...ATLAS.regions].sort((a, b) => {
      const rankA = rank.get(a.n) ?? 100 + ATLAS.regions.indexOf(a);
      const rankB = rank.get(b.n) ?? 100 + ATLAS.regions.indexOf(b);
      return rankA - rankB;
    });
  }, []);

  const selectedWall = useMemo(
    () => ATLAS.walls.find((wall) => wall.id === selectedWallId) ?? null,
    [selectedWallId],
  );

  const selectedTarget = useMemo(() => {
    if (selectedWall?.lat != null && selectedWall.lon != null) {
      return { label: selectedWall.n, coordinates: [selectedWall.lat, selectedWall.lon] as LatLon, zoom: 13 };
    }
    const region = ATLAS.regions.find((item) => item.n === selectedRegion);
    return region
      ? { label: region.n, coordinates: [region.lat, region.lon] as LatLon, zoom: 11 }
      : { label: "Vienna limestone belt", coordinates: VIENNA_BELT_CENTER, zoom: 10 };
  }, [selectedRegion, selectedWall]);

  const cityDistance = useMemo(
    () => distanceKm(VIENNA_CITY_CENTER, selectedTarget.coordinates),
    [selectedTarget],
  );

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedTarget.coordinates[0]},${selectedTarget.coordinates[1]}`)}`;
  const googleDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(VIENNA_CITY_CENTER.join(","))}&destination=${encodeURIComponent(selectedTarget.coordinates.join(","))}`;
  const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${selectedTarget.coordinates[0]}&mlon=${selectedTarget.coordinates[1]}#map=${selectedTarget.zoom}/${selectedTarget.coordinates[0]}/${selectedTarget.coordinates[1]}`;

  const focusMap = useCallback((regionName: string, wall?: AtlasWall | null) => {
    const map = mapRef.current;
    if (!map) return;
    if (wall?.lat != null && wall.lon != null) {
      map.flyTo([wall.lat, wall.lon], 13, { duration: 0.65 });
      return;
    }
    const points = (regionWalls.get(regionName) ?? [])
      .filter((item) => item.lat != null && item.lon != null)
      .map((item) => [item.lat as number, item.lon as number] as LatLon);
    if (points.length > 1) map.flyToBounds(points, { padding: [70, 70], maxZoom: 11, duration: 0.65 });
    else {
      const region = ATLAS.regions.find((item) => item.n === regionName);
      if (region) map.flyTo([region.lat, region.lon], 11, { duration: 0.65 });
    }
  }, [regionWalls]);

  const runFlyby = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (flybyTimerRef.current) window.clearTimeout(flybyTimerRef.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      map.setView(selectedTarget.coordinates, selectedTarget.zoom);
      return;
    }
    map.stop();
    map.flyTo(VIENNA_CITY_CENTER, 9.25, { duration: 0.9, easeLinearity: 0.18 });
    flybyTimerRef.current = window.setTimeout(() => {
      map.flyTo(selectedTarget.coordinates, selectedTarget.zoom, { duration: 1.75, easeLinearity: 0.16 });
    }, 850);
  }, [selectedTarget]);

  useEffect(() => () => {
    if (flybyTimerRef.current) window.clearTimeout(flybyTimerRef.current);
  }, []);

  const chooseRegion = useCallback((regionName: string, shouldFocus = true) => {
    setSelectedRegion(regionName);
    setSelectedWallId(null);
    if (shouldFocus) window.setTimeout(() => focusMap(regionName), 0);
  }, [focusMap]);

  const chooseWall = useCallback((wall: AtlasWall, shouldFocus = true) => {
    setSelectedRegion(wall.rg);
    setSelectedWallId(wall.id);
    if (shouldFocus) window.setTimeout(() => focusMap(wall.rg, wall), 0);
  }, [focusMap]);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapElementRef.current || mapRef.current) return;
        const map = L.map(mapElementRef.current, { zoomControl: true, zoomSnap: 0.25, minZoom: 5 }).setView(VIENNA_BELT_CENTER, 10);
        const streets = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors",
        });
        const terrain = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
          maxZoom: 17,
          attribution: "© OpenStreetMap contributors · OpenTopoMap",
        });
        const satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
          maxZoom: 19,
          attribution: "Tiles © Esri",
        });
        const light = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 20,
          subdomains: "abcd",
          attribution: "© OpenStreetMap contributors · © CARTO",
        });
        const baseLayers: Record<string, any> = { terrain, satellite, streets, light };
        if (MAPBOX_TOKEN) {
          baseLayers.mapbox = L.tileLayer(
            `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
            { maxZoom: 20, attribution: "© Mapbox · © OpenStreetMap contributors" },
          );
        }
        baseLayersRef.current = baseLayers;
        terrain.addTo(map);
        L.circleMarker([48.2082, 16.3738], { radius: 4, color: "#f2ece0", fillColor: "#f2ece0", fillOpacity: 1, weight: 1 })
          .bindTooltip("Wien", { permanent: true, direction: "right", className: styles.viennaLabel })
          .addTo(map);
        mapRef.current = map;
        regionLayersRef.current = L.layerGroup().addTo(map);
        pinLayersRef.current = L.layerGroup().addTo(map);
        distanceLayerRef.current = L.layerGroup().addTo(map);
        setMapReady(true);
      })
      .catch(() => setMapError("The map could not load. The complete region browser remains available."));
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      baseLayersRef.current = {};
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const nextLayer = baseLayersRef.current[activeBaseLayer];
    if (!mapReady || !map || !nextLayer) return;
    for (const layer of Object.values(baseLayersRef.current)) {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
    nextLayer.addTo(map);
  }, [activeBaseLayer, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    mapRef.current.invalidateSize({ pan: false });
    const timer = window.setTimeout(() => mapRef.current?.invalidateSize({ pan: false }), 420);
    return () => window.clearTimeout(timer);
  }, [mapMinimized, mapReady]);

  useEffect(() => {
    if (!mapReady || !window.L || !distanceLayerRef.current) return;
    const L = window.L;
    distanceLayerRef.current.clearLayers();
    L.polyline([VIENNA_CITY_CENTER, selectedTarget.coordinates], {
      color: "#f0c66d",
      weight: 2,
      opacity: 0.78,
      dashArray: "7 9",
      interactive: false,
    }).addTo(distanceLayerRef.current);
  }, [mapReady, selectedTarget]);

  useEffect(() => {
    if (!mapReady || !window.L || !mapRef.current) return;
    const L = window.L;
    regionLayersRef.current.clearLayers();
    pinLayersRef.current.clearLayers();

    for (const region of ATLAS.regions) {
      const color = regionColor(region.n);
      const regionPoints = (regionWalls.get(region.n) ?? [])
        .filter((wall) => wall.lat != null && wall.lon != null)
        .map((wall) => [wall.lat as number, wall.lon as number] as LatLon);
      const hull = coverageHull(regionPoints);
      const isSelected = selectedRegion === region.n;
      const shape = hull.length >= 3
        ? L.polygon(hull, { color, fillColor: color, fillOpacity: isSelected ? 0.34 : 0.18, opacity: isSelected ? 0.95 : 0.68, weight: isSelected ? 3 : 1.5 })
        : L.circle([region.lat, region.lon], { radius: Math.max(4500, Math.min(13000, 3000 + region.ct * 28)), color, fillColor: color, fillOpacity: isSelected ? 0.32 : 0.16, opacity: isSelected ? 0.95 : 0.62, weight: isSelected ? 3 : 1.5 });
      shape.on("click", () => chooseRegion(region.n));
      shape.bindTooltip(region.n, {
        permanent: LANDING_LABELS.has(region.n) || isSelected,
        direction: "center",
        className: styles.regionLabel,
      });
      shape.addTo(regionLayersRef.current);
    }

    for (const wall of ATLAS.walls) {
      if (wall.lat == null || wall.lon == null) continue;
      const color = regionColor(wall.rg);
      const isSelected = selectedWallId === wall.id;
      const pin = L.circleMarker([wall.lat, wall.lon], {
        radius: isSelected ? 7 : 4,
        color: "#f4eee1",
        weight: isSelected ? 2 : 1,
        fillColor: color,
        fillOpacity: 0.94,
      });
      pin.bindTooltip(`${wall.n} · ${wall.ct} routes`, { direction: "top", className: styles.wallLabel });
      pin.on("click", () => chooseWall(wall));
      pin.addTo(pinLayersRef.current);
    }
  }, [chooseRegion, chooseWall, mapReady, regionWalls, selectedRegion, selectedWallId]);

  const searchHits = useMemo<SearchHit[]>(() => {
    const value = query.trim().toLocaleLowerCase();
    if (value.length < 2) return [];
    const regions: SearchHit[] = ATLAS.regions
      .filter((region) => region.n.toLocaleLowerCase().includes(value))
      .slice(0, 3)
      .map((region) => ({ kind: "region", label: region.n, meta: `${regionWalls.get(region.n)?.length ?? 0} crags · ${region.ct} routes`, region: region.n }));
    const walls: SearchHit[] = ATLAS.walls
      .filter((wall) => wall.n.toLocaleLowerCase().includes(value))
      .slice(0, 5)
      .map((wall) => ({ kind: "wall", label: wall.n, meta: `${wall.rg} · ${wall.ct} routes`, region: wall.rg, wallId: wall.id }));
    const routes: SearchHit[] = ATLAS.routes
      .filter((route) => route.n.toLocaleLowerCase().includes(value))
      .slice(0, 4)
      .map((route) => {
        const wall = ATLAS.walls.find((candidate) => candidate.rg === route.rg && candidate.n === route.w);
        return { kind: "route", label: route.n, meta: `${route.g || "grade pending"} · ${route.w}`, region: route.rg, wallId: wall?.id ?? "" };
      });
    return [...regions, ...walls, ...routes].slice(0, 8);
  }, [query, regionWalls]);

  const visibleRegions = useMemo(() => {
    const value = query.trim().toLocaleLowerCase();
    if (value.length < 2) return orderedRegions;
    const matchedNames = new Set(searchHits.map((hit) => hit.region));
    return orderedRegions.filter((region) => matchedNames.has(region.n) || region.n.toLocaleLowerCase().includes(value));
  }, [orderedRegions, query, searchHits]);

  function openSearchHit(hit: SearchHit) {
    if (hit.kind === "region") chooseRegion(hit.region);
    else {
      const wall = ATLAS.walls.find((candidate) => candidate.id === hit.wallId);
      if (wall) chooseWall(wall);
    }
    setQuery("");
  }

  const activeLayerClass = {
    terrain: styles.mapTerrain,
    satellite: styles.mapSatellite,
    streets: styles.mapStreets,
    light: styles.mapLight,
    mapbox: styles.mapMapbox,
  }[activeBaseLayer];

  return (
    <main className={styles.page} style={qaScale ? { width: 1440, transform: "scale(.525)", transformOrigin: "top left" } : undefined}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/" aria-label="Vertical Moment home">
          <img src="/brand/vm-monogram.svg" alt="" width="34" height="28" />
          <span>Vertical Moment</span>
        </a>
        <nav className={styles.nav} aria-label="Photography navigation">
          <a href="/#stories">Stories</a>
          <a href="/#films">Films</a>
          <a href="/#photography">Photography</a>
          <a href="/explore" aria-current="page">Explore</a>
          <a href="/#about">About</a>
        </nav>
        <button className={styles.searchJump} type="button" onClick={() => document.getElementById("atlas-search")?.focus()}>
          Search atlas
        </button>
      </header>

      <section className={styles.hero} aria-labelledby="climbers-lounge-title">
        <img
          className={styles.heroCollage}
          src="/photography/explore/climbers-lounge-canva-collage.png"
          alt="Vertical Moment climbers, hands, equipment and limestone in the supplied Canva collage"
          fetchPriority="high"
        />
        <div className={styles.heroTopVeil} aria-hidden="true" />
        <div className={styles.heroBottomVeil} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <p>Climbers Lounge</p>
          <h1 id="climbers-lounge-title">Climbers Lounge</h1>
          <span>A field guide to the Vienna limestone belt.</span>
          <dl>
            <div><dt>{ATLAS.source.regionCount}</dt><dd>regions</dd></div>
            <div><dt>{ATLAS.source.wallCount}</dt><dd>crags</dd></div>
            <div><dt>{ATLAS.source.routeCount.toLocaleString("en")}</dt><dd>routes</dd></div>
          </dl>
        </div>
      </section>

      <section className={`${styles.atlasSection} ${mapMinimized ? styles.mapMinimized : ""}`} aria-label="Interactive climbing atlas">
        <div className={styles.mapShell}>
          <div ref={mapElementRef} className={`${styles.map} ${activeLayerClass}`} aria-label="Map of climbing regions and crags" />
          <div className={styles.mapLayerControl}>
            <button
              className={styles.layerToggle}
              type="button"
              aria-expanded={layerMenuOpen}
              aria-controls="map-layer-menu"
              onClick={() => setLayerMenuOpen((value) => !value)}
            >
              <MapTrifold size={23} weight="duotone" aria-hidden="true" />
              <span>Map layers<small>{BASE_LAYER_OPTIONS.find((layer) => layer.id === activeBaseLayer)?.label}</small></span>
            </button>
            {layerMenuOpen && (
              <div className={styles.layerMenu} id="map-layer-menu">
                {BASE_LAYER_OPTIONS.map((layer) => (
                  <button
                    type="button"
                    key={layer.id}
                    className={activeBaseLayer === layer.id ? styles.layerActive : ""}
                    aria-pressed={activeBaseLayer === layer.id}
                    onClick={() => setActiveBaseLayer(layer.id)}
                  >
                    <span>{layer.label}</span>
                    <small>{layer.hint}</small>
                  </button>
                ))}
                {!MAPBOX_TOKEN && (
                  <a href="https://www.mapbox.com/maps/" target="_blank" rel="noreferrer">
                    <span>Mapbox</span><small>Connect a public token</small><ArrowSquareOut size={15} aria-hidden="true" />
                  </a>
                )}
                <div className={styles.externalMaps}>
                  <a href={googleMapsUrl} target="_blank" rel="noreferrer">Google Maps <ArrowSquareOut size={14} aria-hidden="true" /></a>
                  <a href={openStreetMapUrl} target="_blank" rel="noreferrer">OpenStreetMap <ArrowSquareOut size={14} aria-hidden="true" /></a>
                </div>
              </div>
            )}
          </div>
          <div className={styles.mapSearch}>
            <label htmlFor="atlas-search">Find a region, crag or route</label>
            <input
              id="atlas-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the atlas…"
              autoComplete="off"
            />
            {query.trim().length >= 2 && (
              <div className={styles.searchResults} role="listbox" aria-label="Atlas search results">
                {searchHits.length ? searchHits.map((hit, index) => (
                  <button key={`${hit.kind}-${hit.label}-${index}`} type="button" onClick={() => openSearchHit(hit)}>
                    <span>{hit.label}</span>
                    <small>{hit.meta}</small>
                  </button>
                )) : <p>No matching region, crag or route.</p>}
              </div>
            )}
          </div>
          {mapError && <p className={styles.mapError}>{mapError}</p>}
          <div className={styles.mapUtilityBar}>
            <span><Ruler size={19} weight="duotone" aria-hidden="true" /><strong>{cityDistance.toFixed(1)} km</strong> straight-line from Vienna</span>
            <button type="button" onClick={runFlyby}>
              <NavigationArrow size={18} weight="fill" aria-hidden="true" />
              Fly to {selectedTarget.label}
            </button>
          </div>
          <div className={styles.mapNote}>
            <strong>Coverage envelopes</strong>
            <span>Drawn from the supplied crag coordinates · select a color to focus</span>
          </div>
        </div>

        <aside className={styles.regionRail} aria-label="All climbing regions">
          <div className={styles.railHeading}>
            <div>
              <p>All regions</p>
              <span>{visibleRegions.length} shown · scroll to browse</span>
            </div>
            <div className={styles.railHeadingActions}>
              <small>Atlas {ATLAS.generated}</small>
              <button
                type="button"
                aria-pressed={mapMinimized}
                onClick={() => setMapMinimized((value) => {
                  const nextValue = !value;
                  if (nextValue) setLayerMenuOpen(false);
                  return nextValue;
                })}
              >
                {mapMinimized
                  ? <ArrowsOut size={18} weight="bold" aria-hidden="true" />
                  : <ArrowsIn size={18} weight="bold" aria-hidden="true" />}
                {mapMinimized ? "Expand map" : "Minimize map"}
              </button>
            </div>
          </div>

          <div className={styles.regionList}>
            {visibleRegions.map((region, index) => {
              const color = regionColor(region.n);
              const walls = regionWalls.get(region.n) ?? [];
              const open = selectedRegion === region.n;
              const activeWall = open ? selectedWall : null;
              const routes = activeWall ? routesByWall.get(activeWall.id) ?? [] : [];
              return (
                <article
                  className={`${styles.regionCard} ${open ? styles.regionOpen : ""}`}
                  key={region.n}
                  style={{ "--region-color": color } as CSSProperties}
                >
                  <button
                    className={styles.regionTrigger}
                    type="button"
                    aria-expanded={open}
                    aria-controls={`region-${slug(region.n)}`}
                    onClick={() => open ? focusMap(region.n) : chooseRegion(region.n)}
                  >
                    <img src={regionImage(region.n, index)} alt="" />
                    <span>
                      <strong>{region.n}</strong>
                      <small>{walls.length} {walls.length === 1 ? "crag" : "crags"} · {region.ct} routes</small>
                    </span>
                    <em>{open ? "Close" : "Open"}</em>
                  </button>

                  {open && (
                    <div className={styles.regionDrawer} id={`region-${slug(region.n)}`}>
                      {activeWall ? (
                        <div className={styles.wallDetail}>
                          <button type="button" onClick={() => setSelectedWallId(null)}>Back to crags</button>
                          <h3>{activeWall.n}</h3>
                          <p>{activeWall.ct} routes · {activeWall.ok} with GPS · grades {activeWall.gr.slice(0, 5).join(", ") || "collecting"} · {cityDistance.toFixed(1)} km from Vienna</p>
                          <div className={styles.wallActions}>
                            <button type="button" onClick={runFlyby}><NavigationArrow size={14} weight="fill" aria-hidden="true" />Flyby</button>
                            <a href={googleDirectionsUrl} target="_blank" rel="noreferrer"><ArrowSquareOut size={14} aria-hidden="true" />Directions</a>
                            {activeWall.gpx && <a href={activeWall.gpx} download>GPX</a>}
                          </div>
                          <div className={styles.routeList} aria-label={`${activeWall.n} routes`}>
                            {routes.length ? routes.map((route, routeIndex) => (
                              <div key={`${route.n}-${routeIndex}`}>
                                <span>{route.n}</span>
                                <small>{route.g || "—"}</small>
                              </div>
                            )) : <p>No individual route rows supplied.</p>}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.wallList} aria-label={`${region.n} crags`}>
                          {walls.map((wall) => (
                            <button key={wall.id} type="button" onClick={() => chooseWall(wall)}>
                              <span>{wall.n}</span>
                              <small>
                                {wall.ct} routes
                                {wall.lat != null && wall.lon != null ? ` · ${distanceKm(VIENNA_CITY_CENTER, [wall.lat, wall.lon]).toFixed(0)} km` : ""}
                                {wall.gpx ? " · GPX" : ""}
                              </small>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </aside>
      </section>

      <section className={styles.experiments} aria-labelledby="experiments-title">
        <p>Beta, built in public</p>
        <h2 id="experiments-title" className={styles.srOnly}>Field experiments</h2>
        <Link href="/nasenwand-concepts" className={styles.experimentRow}>
          <img src="/photography/nasenwand/nasenwand-spatial-1280.webp" alt="Nasenwand spatial study" />
          <span><strong>3D Lab — the Nasenwand study</strong><small>A working space for turning scans, wall photographs and route records into one spatial study. Follow how geometry, access context and future overlays come together before they enter the field guide.</small><em>Open study</em></span>
        </Link>
        <Link href="/vision/wall-reveal" className={styles.experimentRow}>
          <img src="/photography/gallery/vm-6424-face-from-the-approach.webp" alt="Climber on limestone in the Wall Reveal study" />
          <span><strong>Vision — Wall Reveal</strong><small>Computer-vision experiments testing how route lines can be read from real limestone photographs. The aim is a clear field aid that preserves the original image and keeps every suggested line reviewable.</small><em>Open experiment</em></span>
        </Link>
        <Link href="/explore/wachau/panoramas" className={styles.experimentRow}>
          <img src="/photography/panoramas/wachau/wachau-16-preview.webp" alt="Wachau panorama above the Danube" />
          <span><strong>Panoramas — Wachau</strong><small>High-resolution stitched views of the Wachau and Danube corridor, prepared for the shared crag viewer. These studies explore orientation, sector context and a calmer way to understand a wall before the approach.</small><em>Open panorama</em></span>
        </Link>
      </section>

      <footer className={styles.footer}>
        <img src="/brand/vm-monogram.svg" alt="" width="34" height="28" />
        <span>Vertical Moment · Explore preview · source atlas {ATLAS.generated}</span>
      </footer>
    </main>
  );
}
