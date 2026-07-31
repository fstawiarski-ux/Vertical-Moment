import Link from "next/link";
import { SiteNav } from "./components/site-nav";
import { SiteFooter } from "./components/site-footer";
import { CragMap } from "./components/crag-map";
import { Model3D } from "./components/model-3d";
import { PhotoGallery } from "./components/photo-gallery";
import { ExploreBrowser } from "./components/explore-browser";
import { BrowseCrags } from "./components/browse-crags";
import { WelcomeReveal } from "./components/welcome-reveal";
import crags from "./data/crags.json";
import routes from "./data/routes.json";
import models from "./data/models.json";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ crag?: string }>;
}) {
  const sp = await searchParams;
  const R = routes as { la: number | null }[];
  const C = crags as { n: string; la: number; lo: number; r: string[]; osm?: string | null }[];
  const M = models as { crag: string; glb: string; webReady: boolean; note?: string }[];
  const gps = Math.round((R.filter(r => r.la != null).length / R.length) * 100);
  const regions = new Set<string>();
  C.forEach(c => c.r.forEach(x => regions.add(x)));
  const flagship = M[0];
  const flagshipCrag = C.find(c => c.n === flagship?.crag);
  const mappedCrags = C.filter(c => Number.isFinite(c.la) && Number.isFinite(c.lo)).length;
  const kmFromVienna = flagshipCrag ? Math.round(6371 * 2 * Math.asin(Math.sqrt(
    Math.sin(((flagshipCrag.la - 48.2082) * Math.PI / 180) / 2) ** 2 +
    Math.cos(48.2082 * Math.PI / 180) * Math.cos(flagshipCrag.la * Math.PI / 180) *
    Math.sin(((flagshipCrag.lo - 16.3738) * Math.PI / 180) / 2) ** 2
  ))) : null;

  return (
    <>
      <WelcomeReveal />
      <SiteNav />
      <main>
        <section className="view">
          <div className="wrap">
            <div className="home-bar">
              <div>
                <div className="eyebrow">Find your crag</div>
              <p>See the wall in 3D, find what&apos;s near you, drill into a crag for its routes — then help fill the gaps from the field.</p>
              <div className="statline">
                <span><b>{regions.size}</b> regions</span>
                <span><b>{C.length}</b> crags</span>
                <span><b>{R.length}</b> routes</span>
                <span><b>{gps}%</b> with GPS</span>
                </div>
              </div>
              <Link href="/report" className="btn btn-terra home-report">Report</Link>
            </div>

            <div className="mvp-grid">
              <div className="card flagship-3d mvp-model">
                <div className="flagship-head"><span className="flagship-logo brand-mark" aria-hidden="true" /><h2>{flagship.crag}</h2></div>
                <div className="wall-facts" aria-label="Jammerwandl quick facts">
                  <div className="wall-fact"><span className="wall-fact-icon" aria-hidden="true">⌖</span><b>3 regions</b><small>Baden · Helenental · Lindkogel</small></div>
                  <div className="wall-fact"><span className="wall-fact-icon" aria-hidden="true">⌗</span><b>{kmFromVienna ?? "—"} km</b><small>from Vienna</small></div>
                  <div className="wall-fact"><span className="wall-fact-icon" aria-hidden="true">♧</span><b>2 min</b><small>walk from parking</small></div>
                  <div className="wall-fact"><span className="wall-fact-icon" aria-hidden="true">☷</span><b>37 routes</b><small>topo register</small></div>
                </div>

                <p className="muted" style={{ fontSize: 13, margin: "0 0 12px" }}>
                  The first wall we&apos;ve scanned — more are coming as contributors submit photos from the field.
                </p>
                {flagship && (
                  <Model3D glb={flagship.glb} alt={`3D scan of ${flagship.crag}`} webReady={flagship.webReady} height={250} orientation="90deg 0deg 0deg" cameraOrbit="0deg 70deg 4m" />
                )}
                <PhotoGallery
                  photos={[
                    { src: "/gallery/jammerwandl/drone-1.jpg", caption: "Drone overview, north face" },
                    { src: "/gallery/jammerwandl/drone-2.jpg", caption: "Drone overview, upper wall" },
                    { src: "/gallery/jammerwandl/drone-3.jpg", caption: "Drone detail, central sector" },
                    { src: "/gallery/jammerwandl/drone-4.jpg", caption: "Drone detail, texture close-up" },
                    { src: "/gallery/jammerwandl/topo-illustration.jpg", caption: "Illustrated topo — 37 routes across 3 sectors" },
                    { src: "/gallery/jammerwandl/route-register.jpg", caption: "Route register — grades, no. 1–37" },
                    { src: "/gallery/jammerwandl/guidebook-page.jpg", caption: "Original guidebook page, Jammerwandl" },
                  ]}
                />
              </div>
              <div className="card gallery-card">
                <div className="eyebrow">Photo &amp; topo gallery</div>
                <h2>Photo &amp; topo gallery</h2>
                <PhotoGallery showcase photos={[
                  { src: "/gallery/jammerwandl/guidebook-page.jpg", caption: "Original guidebook page, Jammerwandl" },
                  { src: "/gallery/jammerwandl/topo-illustration.jpg", caption: "Illustrated topo, 37 routes across 3 sectors" },
                  { src: "/gallery/jammerwandl/drone-1.jpg", caption: "Drone overview, north face" },
                  { src: "/gallery/jammerwandl/drone-2.jpg", caption: "Drone overview, upper wall" },
                  { src: "/gallery/jammerwandl/drone-3.jpg", caption: "Drone detail, central sector" },
                  { src: "/gallery/jammerwandl/drone-4.jpg", caption: "Drone detail, texture close-up" },
                  { src: "/gallery/jammerwandl/route-register.jpg", caption: "Route register, routes 1 to 37" },
                ]} />
                <div className="gallery-links">
                  {flagshipCrag && <a className="gallery-icon-link" href={`https://www.google.com/maps/search/?api=1&query=${flagshipCrag.la},${flagshipCrag.lo}`} target="_blank" rel="noopener" aria-label="Open Jammerwandl in Google Maps" title="Google Maps"><span aria-hidden="true">G</span></a>}
                  <a className="gallery-icon-link" href="https://www.bergsteigen.com/?s=Jammerwandl" target="_blank" rel="noopener" aria-label="Search Jammerwandl on Bergsteigen" title="Bergsteigen"><span aria-hidden="true">B</span></a>
                  {flagshipCrag?.osm && <a className="gallery-icon-link" href={`https://www.openstreetmap.org/${flagshipCrag.osm}`} target="_blank" rel="noopener" aria-label="Open Jammerwandl in OpenStreetMap" title="OpenStreetMap"><span aria-hidden="true">⌖</span></a>}
                </div>
              </div>
              <CragMap initialCragName={sp.crag} showPanel={false} />

            <div className="legend mvp-legend">
              <span><i style={{ background: "#D89A34" }} />In guidebook</span>
              <span><i style={{ background: "#93A382" }} />OSM extra — not catalogued yet</span>
              <span style={{ marginLeft: "auto" }}>Crag data © OpenStreetMap contributors (ODbL 1.0)</span>
            </div>

            <div className="discovery-grid mvp-discovery">
              <div className="search-card">
                <div className="eyebrow">Search</div>
                <h2>Find a route or crag</h2>
                <ExploreBrowser compact />
              </div>
              <BrowseCrags />
            </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter stats={{ regions: regions.size, crags: C.length, mappedCrags, routes: R.length, gps, scans: M.filter(m => m.webReady).length }} />
    </>
  );
}
