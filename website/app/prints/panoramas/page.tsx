import type { Metadata } from 'next';
import PanoramaEditions from './panorama-editions';

export const metadata: Metadata = {
  title: 'Wachau Panorama Studies — Vertical Moment',
  description:
    'A collection of Wachau landscape and limestone panoramas presented as visual studies and provisional regional references.',
  alternates: { canonical: '/prints/panoramas' },
};

export default function PanoramaEditionsPage() {
  return <PanoramaEditions />;
}
