/* eslint-disable @next/next/no-img-element */

import type { Metadata } from 'next';
import '../photography-theme.css';
import NasenwandConceptGallery from '../components/nasenwand/nasenwand-concept-gallery';
import { NASENWAND_EXPERIENCE } from '../data/nasenwand-concepts';

export const metadata: Metadata = {
  title: 'Nasenwand flagship experience',
  description:
    'The Nasenwand flagship media gallery with film, scroll scrub, loops, depth layers, Split Reveal, Geological Wipe and Cinematic studies.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NasenwandConceptsPage() {
  return <NasenwandConceptGallery config={NASENWAND_EXPERIENCE} />;
}
