import type { Metadata } from 'next';
import '../photography-theme.css';
import NasenwandFlagshipExplorer from '../components/nasenwand/nasenwand-flagship-explorer';

export const metadata: Metadata = {
  title: 'Nasenwand — Vertical Moment Explorer',
  description: 'Explore Nasenwand from place to wall, sector and topo with drone scrub, panorama and route information.',
  robots: { index: false, follow: false },
};

export default function NasenwandConceptsPage() {
  return <NasenwandFlagshipExplorer />;
}
