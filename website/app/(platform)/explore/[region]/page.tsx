import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CragMap } from "../../components/crag-map";
import { getAllRegionSlugs, getRegionDetail } from "../../lib/climbing-data";

export function generateStaticParams() {
  return getAllRegionSlugs().map(region => ({ region }));
}

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const region = getRegionDetail((await params).region);
  if (!region) return {};
  return {
    title: `${region.name} — Vertical Moment`,
    description: `${region.cragCount} crags, ${region.routeCount} routes in ${region.name}. Digitised from the Keltenkalk guidebook and OpenStreetMap.`,
    alternates: { canonical: region.path },
  };
}

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const region = getRegionDetail((await params).region);
  if (!region) notFound();

  return (
    <main className="explore-page">
      <div className="explore-head">
        <p className="eyebrow"><Link href="/explore">Explore</Link> / {region.name}</p>
        <h1>{region.name}</h1>
        <p className="muted">{region.cragCount} crags · {region.routeCount} routes</p>
      </div>
      <CragMap initialRegionSlug={region.slug} />
      {region.links.length > 0 && (
        <div className="more-info" style={{ maxWidth: 640, margin: "24px auto 0" }}>
          <h2 style={{ fontSize: 14 }}>More information</h2>
          {region.links.map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noopener" style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
              {l.label}{l.kind === "search" ? " (search)" : ""}
            </a>
          ))}
          {region.moreInfoNote && <p className="muted" style={{ fontSize: 12.5 }}>{region.moreInfoNote}</p>}
          <p className="muted" style={{ fontSize: 11.5 }}>© OpenStreetMap contributors</p>
        </div>
      )}
      <ul style={{ maxWidth: 640, margin: "24px auto", padding: 0, listStyle: "none" }}>
        {region.crags.map(c => (
          <li key={c.slug}>
            <Link href={c.path}>{c.name}</Link>
            <span className="muted" style={{ marginLeft: 8, fontSize: 12.5 }}>
              {c.routeCount ? `${c.routeCount} routes` : "not catalogued yet"}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
