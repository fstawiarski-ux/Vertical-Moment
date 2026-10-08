import type { MetadataRoute } from "next";
import huts from "@/lib/huts/generated/identities.json";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verticalmoment.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {url:`${SITE_URL}/huts`,priority:0.8,lastModified:"2026-10-08"},
    ...huts.map(h=>({url:`${SITE_URL}/huts/${h.id}`,priority:0.5,lastModified:"2026-10-08"})),
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/climbers-lounge`, priority: 0.8 },
    { url: `${SITE_URL}/prints/panoramas`, priority: 0.7 },
    { url: `${SITE_URL}/technology`, priority: 0.4 },
  ];
}
