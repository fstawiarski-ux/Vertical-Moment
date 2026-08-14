import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PanoramaExperience from '../../../../components/panorama-experience';
import {
  getKnownPanoramaExperience,
  panoramaExperienceDefinitions,
} from '../../../../data/panorama-experiences';

interface PageProps {
  params: Promise<{ region: string; crag: string }>;
  searchParams: Promise<{ route?: string | string[] }>;
}

export function generateStaticParams() {
  return panoramaExperienceDefinitions.map((item) => ({
    region: item.regionSlug,
    crag: item.cragSlug,
  }));
}

export async function generateMetadata({ params }: Pick<PageProps, 'params'>): Promise<Metadata> {
  const { region, crag } = await params;
  const experience = getKnownPanoramaExperience(region, crag);
  if (!experience) return {};
  return {
    title: `${experience.crag} panorama`,
    description: `Interactive ${experience.crag}, ${experience.region} experience with panorama, topo, 360-degree, video and 3D views.`,
    alternates: { canonical: `/panoramas/${region}/${crag}` },
  };
}

export default async function CragPanoramaPage({ params, searchParams }: PageProps) {
  const { region, crag } = await params;
  const query = await searchParams;
  const routeFocus = Array.isArray(query.route) ? query.route[0] : query.route;
  const experience = getKnownPanoramaExperience(region, crag);
  if (!experience) notFound();
  return (
    <PanoramaExperience
      experience={experience}
      routeFocus={routeFocus}
      backHref={`/explore/${region}`}
    />
  );
}
