import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CragMap } from "../../../components/crag-map";
import { Model3D } from "../../../components/model-3d";
import { getAllCragParams, getCragDetail } from "../../../lib/climbing-data";
import { find3DModel } from "../../../lib/media";

export function generateStaticParams() {
  return getAllCragParams();
}

export async function generateMetadata({ params }: { params: Promise<{ region: string; crag: string }> }): Promise<Metadata> {
  const { region, crag: cragSlug } = await params;
  const crag = getCragDetail(region, cragSlug);
  if (!crag) return {};
  return {
    title: `${crag.name} — ${crag.regionName} — Vertical Moment`,
    description: crag.isStub
      ? `${crag.name} in ${crag.regionName}. Location from OpenStreetMap; routes not yet catalogued.`
      : `${crag.routeCount} routes at ${crag.name}, ${crag.regionName}${crag.gradeSpan ? ` (${crag.gradeSpan.min}–${crag.gradeSpan.max})` : ""}.`,
    alternates: { canonical: crag.path },
  };
}

export default async function CragPage({ params }: { params: Promise<{ region: string; crag: string }> }) {
  const { region, crag: cragSlug } = await params;
  const crag = getCragDetail(region, cragSlug);
  if (!crag) notFound();
  const model = find3DModel(crag.name);
  const hasUnverified = crag.routes.some(r => r.verificationStatus === "imported-unverified");

  return (
    <main className="explore-page crag-page">
      <div className="explore-head">
        <p className="eyebrow">
          <Link href="/explore">Explore</Link> / <Link href={`/explore/${crag.regionSlug}`}>{crag.regionName}</Link> / {crag.name}
        </p>
        <h1>{crag.name}</h1>
        <p className="muted">
          {crag.distanceFromViennaKm != null ? `${crag.distanceFromViennaKm} km from Wien · ` : ""}
          {crag.routeCount} route{crag.routeCount === 1 ? "" : "s"}
          {crag.gradeSpan && ` · ${crag.gradeSpan.min}–${crag.gradeSpan.max}`}
        </p>
        {crag.isStub && (
          <p className="muted">Not catalogued yet. This crag came from OpenStreetMap — a contributor mission can transcribe its routes.</p>
        )}
      </div>

      <div className="crag-actions" style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        {crag.latitude != null && (
          <a className="btn btn-terra" href={`https://www.google.com/maps/search/?api=1&query=${crag.latitude},${crag.longitude}`} target="_blank" rel="noopener">Maps</a>
        )}
      </div>

      {model && (
        <div style={{ maxWidth: 640, margin: "0 auto 20px" }}>
          <Model3D glb={model.glb} alt={`3D scan of ${crag.name}`} webReady={model.webReady} note={model.note} />
        </div>
      )}

      {crag.routes.length > 0 && (
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontSize: 15 }}>Routes</h2>
          <ul style={{ padding: 0, listStyle: "none" }}>
            {crag.routes.map(r => (
              <li key={r.id} id={r.id} style={{ padding: "6px 0", borderBottom: "1px solid var(--line-2, #38493D)" }}>
                <span style={{ fontWeight: 600 }}>{r.name}</span>{" "}
                <span className="muted">{r.grade ?? "—"}</span>{" "}
                {r.verificationStatus === "imported-unverified" && (
                  <span className="unverified-badge" title="Imported, not yet verified on site">unverified</span>
                )}
              </li>
            ))}
          </ul>
          {hasUnverified && (
            <p className="muted" style={{ fontSize: 12 }}>
              Routes marked <strong>unverified</strong> are imported from source data and not yet independently
              checked. Grades, names and positions may be wrong — verify on site before you commit to anything.
            </p>
          )}
        </div>
      )}

      {crag.links.length > 0 && (
        <div className="more-info" style={{ maxWidth: 640, margin: "20px auto 0" }}>
          <h2 style={{ fontSize: 14 }}>More information</h2>
          {crag.links.map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noopener" style={{ display: "block", fontSize: 13, marginBottom: 6 }} title={l.note ?? undefined}>
              {l.label}{l.kind === "search" ? " (search)" : ""}
            </a>
          ))}
          <p className="muted" style={{ fontSize: 12.5 }}>No topos here yet — these sites have them. Verify bolts on site.</p>
          <p className="muted" style={{ fontSize: 11.5 }}>© OpenStreetMap contributors</p>
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <CragMap initialRegionSlug={crag.regionSlug} initialCragSlug={crag.slug} />
      </div>
    </main>
  );
}
