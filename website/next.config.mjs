import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // /start remains a legacy entry point, but it should land in the current
    // field-app journey rather than strand users on the marketing homepage.
    return ["/start"]
      .map((source) => ({ source, destination: "/explore-app?intro=skip", permanent: false }));
  },
};

export default nextConfig;
