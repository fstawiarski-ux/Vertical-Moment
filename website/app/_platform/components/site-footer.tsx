import Link from "next/link";

export function SiteFooter({ stats }: { stats?: { regions: number; crags: number; mappedCrags: number; routes: number; gps: number; scans: number } }) {
  return (
    <footer>
      <div className="wrap">
        {stats && <div className="project-stats" aria-label="Project data coverage">
          <span><b>{stats.regions}</b> regions</span>
          <span><b>{stats.crags}</b> crags</span>
          <span><b>{stats.mappedCrags}</b> mapped</span>
          <span><b>{stats.routes}</b> routes</span>
          <span><b>{stats.gps}%</b> GPS-linked</span>
          <span><b>{stats.scans}</b> 3D scan</span>
        </div>}
        <span>Vertical Moment Collective · beta · data reconciled from master + OpenStreetMap</span>
        <span>Crag &amp; coordinate data © OpenStreetMap contributors (ODbL 1.0)</span>
        <Link href="/technology" style={{ color: "var(--terra)", fontWeight: 600 }}>How this is built</Link>
      </div>
    </footer>
  );
}
