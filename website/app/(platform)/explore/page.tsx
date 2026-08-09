import type { Metadata } from "next";
import Link from "next/link";
import { CragMap } from "../components/crag-map";
import { getAllRegions } from "../lib/climbing-data";

export const metadata: Metadata = {
  title: "Climbers Lounge — Vertical Moment",
  description: "The Vienna limestone belt: regions, crags and routes, digitised from the Keltenkalk guidebook and OpenStreetMap.",
  alternates: { canonical: "/explore" },
};

export default function ExplorePage() {
  const regions = getAllRegions();
  const totalRoutes = regions.reduce((sum, r) => sum + r.routeCount, 0);
  const totalCrags = regions.reduce((sum, r) => sum + r.cragCount, 0);

  return (
    <main className="explore-page">
      <div className="explore-head">
        <h1>Climbers Lounge</h1>
        <p className="muted">
          {regions.length} regions · {totalCrags} crags · {totalRoutes} routes, digitised from the Keltenkalk
          guidebook and OpenStreetMap. © OpenStreetMap contributors.
        </p>
      </div>
      <CragMap />

      <div className="beta-section" style={{ maxWidth: 640, margin: "40px auto 0" }}>
        <h2 style={{ fontSize: 15 }}>Beta prototypes</h2>
        <p className="muted" style={{ fontSize: 13 }}>
          Early experiments living here while they find their shape, rather than crowding the photography pages.
        </p>
        <ul style={{ padding: 0, listStyle: "none", display: "grid", gap: 8, marginTop: 12 }}>
          <li>
            <Link href="/nasenwand-concepts" className="btn btn-terra">3D Lab — the Nasenwand study</Link>
          </li>
          <li>
            <Link href="/vision/wall-reveal" className="btn btn-terra">Vision — Wall Reveal</Link>
          </li>
          <li>
            <Link href="/explore/wachau/panoramas" className="btn btn-terra">Panoramas — Wachau</Link>
          </li>
          <li>
            <Link href="/prints/panoramas" className="btn btn-terra">Panorama editions (prints)</Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
