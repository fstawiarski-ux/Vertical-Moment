import type { Metadata } from "next";
import { CragMap } from "../components/crag-map";
import { getAllRegions } from "../lib/climbing-data";

export const metadata: Metadata = {
  title: "Explore — Vertical Moment",
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
        <h1>Explore the crags</h1>
        <p className="muted">
          {regions.length} regions · {totalCrags} crags · {totalRoutes} routes, digitised from the Keltenkalk
          guidebook and OpenStreetMap. © OpenStreetMap contributors.
        </p>
      </div>
      <CragMap />
    </main>
  );
}
