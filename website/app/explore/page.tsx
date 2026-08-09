import type { Metadata } from 'next';
import Link from 'next/link';
import { BrowseCrags } from '../_platform/components/browse-crags';

export const metadata: Metadata = {
  title: 'Explore climbing',
  description: 'Browse Vertical Moment regions, crags and routes, then open their panorama experiences.',
};

interface ExplorePageProps {
  searchParams: Promise<{ crag?: string | string[] }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const query = await searchParams;
  const initialCrag = Array.isArray(query.crag) ? query.crag[0] : query.crag;

  return (
    <main className="panorama-explorer-page">
      <header className="panorama-explorer-head">
        <Link href="/" className="panorama-explorer-brand">Vertical Moment</Link>
        <nav aria-label="Explorer links">
          <Link href="/explore/wachau/panoramas">Wachau panoramas</Link>
          <Link href="/">Photography</Link>
        </nav>
      </header>
      <section className="panorama-explorer-intro">
        <p className="eyebrow">Climbing explorer</p>
        <h1>Region to crag to route.</h1>
        <p>Choose a crag, then open its immersive panorama from the crag card or any route row.</p>
      </section>
      <section className="panorama-explorer-browser" aria-label="Browse climbing regions and routes">
        <BrowseCrags initialCrag={initialCrag} />
      </section>
    </main>
  );
}
