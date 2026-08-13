import type { Metadata } from "next";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";

export const metadata: Metadata = {
  title: "How Vertical Moment Is Built",
  description: "A plain-language overview of the technology behind the Vertical Moment website and climbing tools.",
  alternates: { canonical: "/technology" },
};

export default function TechnologyPage() {
  return (
    <>
      <SiteNav who={null} />
      <main>
        <section className="view">
          <div className="wrap" style={{ maxWidth: 760 }}>
            <div className="eyebrow">For the curious</div>
            <h1 style={{ fontSize: "clamp(28px,5vw,44px)" }}>What this runs on</h1>
            <p className="muted" style={{ margin: "10px 0 28px" }}>
              Nothing here is required reading — the site works fine without it. This page exists
              for anyone who wants to know how it&apos;s actually built.
            </p>

            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <h2 style={{ fontSize: 18 }}>The website</h2>
              <p style={{ lineHeight: 1.6, margin: "8px 0 0" }}>
                Built with <strong>Next.js</strong> (a React framework) and hosted on{" "}
                <strong>Cloudflare Workers</strong>. The map uses <strong>Leaflet</strong>, an
                open-source mapping library, drawing tiles from OpenStreetMap/CARTO (default view),
                OpenTopoMap (terrain) and Esri (satellite).
              </p>
            </div>

            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <h2 style={{ fontSize: 18 }}>The 3D wall scans</h2>
              <p style={{ lineHeight: 1.6, margin: "8px 0 0" }}>
                Walls are scanned with photogrammetry software (RealityScan), which turns a set of
                overlapping photos into a 3D mesh. That raw scan is far too large for a phone to
                load, so it&apos;s compressed (Draco compression) — often 30–40x smaller — before it
                ships to the site. The viewer itself is <strong>{"<model-viewer>"}</strong>, a
                free, open web component that also supports viewing a wall in AR on supported phones.
              </p>
            </div>

            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <h2 style={{ fontSize: 18 }}>The data</h2>
              <p style={{ lineHeight: 1.6, margin: "8px 0 0" }}>
                Crag locations come from <strong>OpenStreetMap</strong> (open data, credited on
                every page that uses it). Route data is reconciled from the project&apos;s own
                master spreadsheet — see the <strong>Contribute</strong> page for a downloadable
                copy. Large files (scans, photos, GPX tracks) are stored with{" "}
                <strong>Git LFS</strong> so the project&apos;s history doesn&apos;t balloon.
              </p>
            </div>

            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <h2 style={{ fontSize: 18 }}>What&apos;s next</h2>
              <p style={{ lineHeight: 1.6, margin: "8px 0 0" }}>
                Field reports currently save to your own browser. The next phase wires up a real
                database (<strong>Cloudflare D1</strong>) and file storage (<strong>Cloudflare
                R2</strong>) so submissions reach a review queue instead — plus optional email
                sign-in for contributors who want to track what they&apos;ve submitted.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
