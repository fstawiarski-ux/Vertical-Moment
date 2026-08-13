import type { Metadata } from 'next';
import WallRevealExperience from './wall-reveal-experience';

export const metadata: Metadata = {
  title: 'Wall Reveal — Vision',
  description:
    'A mobile-first Vertical Moment vision study: photography, scroll-scrub motion, provisional topo layers and a real browser-ready 3D wall.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Vertical Moment — Wall Reveal',
    description: 'One climbing wall, revealed from place to route to 3D.',
    images: ['/photography/nasenwand/nasenwand-spatial-1280.webp'],
  },
};

export default function WallRevealPage() {
  return <WallRevealExperience />;
}
