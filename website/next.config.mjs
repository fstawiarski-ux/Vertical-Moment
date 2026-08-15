import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const pwaContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://*.tile.opentopomap.org https://server.arcgisonline.com https://*.basemaps.cartocdn.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "media-src 'self' blob:",
  "connect-src 'self' https://router.project-osrm.org",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'self' https://www.google.com",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
      {
        source: "/explore-app/:path*",
        headers: [
          { key: "Content-Security-Policy", value: pwaContentSecurityPolicy },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/explore-app" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
  async redirects() {
    // /start remains a legacy public entry point. Keep the private field app
    // share-by-link only while its public release is still in development.
    return ["/start"]
      .map((source) => ({ source, destination: "/climbers-lounge", permanent: false }));
  },
};

export default nextConfig;
