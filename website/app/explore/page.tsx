import { getViewer } from "@/lib/identity";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { ExploreBrowser } from "../components/explore-browser";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const viewer = await getViewer();
  return (
    <>
      <SiteNav who={viewer.display ?? "Ambassador"} />
      <main>
        <section className="view">
          <div className="wrap">
            <div className="eyebrow">Search</div>
            <h1 style={{ fontSize: "clamp(30px,5vw,52px)" }}>Find a route or crag</h1>
            <p className="muted" style={{ margin: "10px 0 18px", maxWidth: 620 }}>
              Search opens straight into the map&apos;s region → crag → route drill-down —
              no flat list of 632 routes to scroll through.
            </p>
            <ExploreBrowser />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
