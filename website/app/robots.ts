import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verticalmoment.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow:["/account","/api/auth/","/api/hut-workspace","/api/hut-shares","/share/","/explore-app/planner/trips","/explore-app/planner/today","/explore-app/planner/list"] },
      {
        userAgent: [
          "Amazonbot",
          "Applebot-Extended",
          "Bytespider",
          "CCBot",
          "ClaudeBot",
          "CloudflareBrowserRenderingCrawler",
          "Google-Extended",
          "GPTBot",
        ],
        disallow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
