import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verticalmoment.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/climbers-lounge`, priority: 0.8 },
    { url: `${SITE_URL}/prints/panoramas`, priority: 0.7 },
    { url: `${SITE_URL}/panoramas/wachau`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${SITE_URL}/panoramas/wachau/nasenwand`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${SITE_URL}/technology`, priority: 0.4 },
  ];
}
