import type { Metadata } from 'next';
import PanoramaExperience from '../../../../components/panorama-experience';
import { getPanoramaExperience } from '../../../../data/panorama-experiences';

interface PageProps {
  params: Promise<{ region: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { region } = await params;
  const experience = getPanoramaExperience(region);
  return {
    title: `${experience.region} panoramas`,
    description: `Interactive panorama collection for the ${experience.region} climbing region.`,
  };
}

export default async function RegionPanoramaPage({ params }: PageProps) {
  const { region } = await params;
  const experience = getPanoramaExperience(region);
  return <PanoramaExperience experience={experience} backHref="/explore" />;
}
