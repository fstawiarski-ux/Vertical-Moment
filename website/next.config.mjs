import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return ["/explore", "/technology", "/report", "/contribute", "/review-preview", "/start"]
      .map((source) => ({ source, destination: "/", permanent: false }));
  },
};

export default nextConfig;