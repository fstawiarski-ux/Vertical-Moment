import type { Metadata } from 'next';
import PanoramaExperience from '../../../../../components/panorama-experience';
import { getPanoramaExperience } from '../../../../../data/panorama-experiences';

interface PageProps {
  params: Promise<{ region: string; crag: string }>;
  searchParams: Promise<{ route?: string | string[] }>;
}

export async function generateMetadata({ params }: Pick<PageProps, 'params'>): Promise<Metadata> {
  const { region, crag } = await params;
  const experience = getPanoramaExperience(region, crag);
  return {
    title: `${experience.crag} panorama`,
    description: `Interactive ${experience.crag}, ${experience.region} experience with panorama, topo, 360-degree, video and 3D views.`,
  };
}

export default async function CragPanoramaPage({ params, searchParams }: PageProps) {
  const { region, crag } = await params;
  const query = await searchParams;
  const routeFocus = Array.isArray(query.route) ? query.route[0] : query.route;
  const experience = getPanoramaExperience(region, crag);

  return (
    <PanoramaExperience
      experience={experience}
      routeFocus={routeFocus}
      backHref={`/explore/${encodeURIComponent(region)}/panoramas`}
    />
  );
}
