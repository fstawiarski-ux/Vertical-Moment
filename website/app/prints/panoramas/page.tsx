import type { Metadata } from 'next';
import PanoramaEditions from './panorama-editions';

export const metadata: Metadata = {
  title: 'Wachau Panorama Editions — Vertical Moment',
  description:
    'High-resolution Wachau landscape and limestone panoramas for print, regional reference and future climbing-wall registration.',
};

export default function PanoramaEditionsPage() {
  return <PanoramaEditions />;
}
