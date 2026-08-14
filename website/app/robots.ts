import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verticalmoment.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
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
