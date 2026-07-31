import { getViewer } from "@/lib/identity";
import { SiteNav } from "./components/site-nav";
import { SiteFooter } from "./components/site-footer";
import { CragMap } from "./components/crag-map";
import crags from "./data/crags.json";
import routes from "./data/routes.json";

// Reads the per-request identity header for the optional "who" label.
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ crag?: string }>;
}) {
  const viewer = await getViewer();
  const sp = await searchParams;
  const R = routes as { la: number | null }[];
  const C = crags as { r: string[] }[];
  const gps = Math.round((R.filter(r => r.la != null).length / R.length) * 100);
  const regions = new Set<string>();
  C.forEach(c => c.r.forEach(x => regions.add(x)));

  return (
    <>
      <SiteNav who={viewer.display ?? "Ambassador"} />
      <main>
        <section className="view">
          <div className="wrap">
            <div className="hero">
              <div className="eyebrow">Climbing areas near Vienna</div>
              <h1>Find a wall.<br />Open a crag. Track down the route.</h1>
              <p>Browse every region on the map, drill into a crag to see its routes — then help fill the gaps from the field.</p>
              <div className="statline">
                <span><b>{regions.size}</b> regions</span>
                <span><b>{C.length}</b> crags</span>
                <span><b>{R.length}</b> routes</span>
                <span><b>{gps}%</b> with GPS</span>
              </div>
            </div>
            <CragMap initialCragName={sp.crag} />
            <div className="legend">
              <span><i style={{ background: "#D89A34" }} />In guidebook</span>
              <span><i style={{ background: "#93A382" }} />OSM extra — not catalogued yet</span>
              <span style={{ marginLeft: "auto" }}>Crag data © OpenStreetMap contributors (ODbL 1.0)</span>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
