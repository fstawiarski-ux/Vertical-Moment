/* eslint-disable @next/next/no-img-element */

import type { Metadata } from 'next';
import '../photography-theme.css';
import NasenwandConceptGallery from '../components/nasenwand/nasenwand-concept-gallery';
import { NASENWAND_EXPERIENCE } from '../data/nasenwand-concepts';

export const metadata: Metadata = {
  title: 'Nasenwand spatial concepts',
  description: 'Split Reveal, Geological Wipe and Cinematic spatial studies for the Vertical Moment photography website.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NasenwandConceptsPage() {
  return <NasenwandConceptGallery config={NASENWAND_EXPERIENCE} />;
}
