import { headers } from "next/headers";

const publicProductionHosts = new Set(["verticalmoment.com", "www.verticalmoment.com"]);

/**
 * Cloudflare's Worker runtime does not reliably expose NODE_ENV to server components.
 * Keep local development available, but identify the public production host explicitly.
 */
export async function isPublicProductionSurface() {
  if (process.env.NODE_ENV === "production") {
    return true;
  }

  const host = (await headers()).get("host")?.split(":", 1)[0].toLowerCase();
  return host ? publicProductionHosts.has(host) : false;
}
