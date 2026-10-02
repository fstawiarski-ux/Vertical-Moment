import { NextResponse, type NextRequest } from "next/server";
import { isBlockedDevelopmentRequest, isPwaPreviewRequest } from "./src/core/pwaPreviewAccess";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isBlockedDevelopmentRequest(pathname)) {
    return new NextResponse(null, {
      status: 404,
      headers: {
        "cache-control": "no-store, max-age=0",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  }

  const response = NextResponse.next();
  if (isPwaPreviewRequest(pathname, request.nextUrl.search)) {
    response.headers.set("x-robots-tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: "/:path*",
};
