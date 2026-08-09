import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // Leftover from when app/_platform was private-prefixed and none of
    // these routes resolved. Commit 54a8e09 un-prefixed the folder to
    // app/(platform) and activated them — this list should have shrunk
    // then and didn't, so every one of these routes has actually kept
    // 307-redirecting to "/" the whole time, contradicting PLATFORM.md's
    // claim that they "all resolve." /explore now has a real page (the
    // crag locator) so it comes out of the list. The rest are still
    // redirected — /start and /review-preview are the two the brief
    // flags for Filip to decide on gating; /technology and /contribute
    // weren't in scope for this change, left as found.
    return ["/technology", "/report", "/contribute", "/review-preview", "/start"]
      .map((source) => ({ source, destination: "/", permanent: false }));
  },
};

export default nextConfig;