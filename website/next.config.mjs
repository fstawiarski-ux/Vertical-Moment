import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // /start remains a legacy entry point. Technology is public and the
    // review preview is a direct, noindex internal draft surface, so neither
    // should be silently redirected to the homepage.
    return ["/start"]
      .map((source) => ({ source, destination: "/", permanent: false }));
  },
};

export default nextConfig;
