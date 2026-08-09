import type { MetadataRoute } from "next";
import { getAllRegions, getAllCrags } from "./(platform)/lib/climbing-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verticalmoment.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const regions = getAllRegions();
  const crags = getAllCrags();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/explore`, priority: 0.9 },
  ];

  const regionEntries: MetadataRoute.Sitemap = regions.map(r => ({
    url: `${SITE_URL}${r.path}`,
    priority: 0.7,
  }));

  const cragEntries: MetadataRoute.Sitemap = crags.map(c => ({
    url: `${SITE_URL}${c.path}`,
    priority: c.isStub ? 0.4 : 0.6,
  }));

  return [...staticEntries, ...regionEntries, ...cragEntries];
}
