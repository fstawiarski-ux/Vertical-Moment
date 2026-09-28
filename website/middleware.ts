import { NextResponse, type NextRequest } from "next/server";
import { isPwaPreviewRequest } from "./src/core/pwaPreviewAccess";

const maintenanceHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Work in progress — Vertical Moment</title>
    <style>
      :root { color-scheme: dark; font-family: system-ui, sans-serif; }
      * { box-sizing: border-box; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 2rem; background: #151816; color: #f4f1e9; text-align: center; }
      main { width: min(100%, 38rem); }
      .brand { color: #c4b77c; font-size: .75rem; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; }
      h1 { margin: 1rem 0; font-size: clamp(2.5rem, 7vw, 5rem); line-height: 1.05; }
      p { font-size: 1.125rem; line-height: 1.7; opacity: .82; }
    </style>
  </head>
  <body>
    <main>
      <span class="brand">Vertical Moment</span>
      <h1>Work in progress</h1>
      <p>This website is temporarily offline while I review its content. Please check back later.</p>
    </main>
  </body>
</html>`;

export function middleware(request: NextRequest) {
  if (isPwaPreviewRequest(request.nextUrl.pathname, request.nextUrl.search)) {
    const response = NextResponse.next();
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return response;
  }

  return new NextResponse(maintenanceHtml, {
    status: 503,
    headers: {
      "cache-control": "no-store, max-age=0",
      "content-type": "text/html; charset=utf-8",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

export const config = {
  matcher: "/:path*",
};
