import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PanoramaExperience from '../../../components/panorama-experience';
import {
  getKnownPanoramaExperience,
  regionPanoramaCollections,
} from '../../../data/panorama-experiences';

interface PageProps {
  params: Promise<{ region: string }>;
}

export function generateStaticParams() {
  return regionPanoramaCollections.map((item) => ({ region: item.regionSlug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { region } = await params;
  const experience = getKnownPanoramaExperience(region);
  if (!experience) return {};
  return {
    title: `${experience.region} panoramas`,
    description: `Interactive panorama collection for the ${experience.region} climbing region.`,
    alternates: { canonical: `/panoramas/${region}` },
  };
}

export default async function RegionPanoramaPage({ params }: PageProps) {
  const { region } = await params;
  const experience = getKnownPanoramaExperience(region);
  if (!experience) notFound();
  return <PanoramaExperience experience={experience} backHref="/explore" />;
}
