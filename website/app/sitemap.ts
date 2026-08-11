import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verticalmoment.com";

export default function sitemap(): MetadataRoute.Sitemap {
  // The original /explore tree is preserved in code but intentionally kept
  // out of discovery while Climbers Lounge is developed in private.
  return [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/climbers-lounge`, priority: 0.8 },
  ];
}
