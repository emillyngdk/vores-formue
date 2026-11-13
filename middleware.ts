import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, openInDev, safeEqual, sessionToken } from "@/lib/auth";

/**
 * Alt på siden kræver login, også JavaScript-filerne, fordi vores tal ligger i dem.
 * Mangler SITE_PASSWORD i produktion, er siden låst for alle.
 */
export async function middleware(req: NextRequest) {
  if (openInDev()) return NextResponse.next();
  const password = process.env.SITE_PASSWORD;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (password && token && safeEqual(token, await sessionToken(password))) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return new NextResponse("Log ind for at se siden.", { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login$|api/login$|robots\\.txt$|manifest\\.webmanifest$|icons/|apple-icon\\.png$|icon\\.png$|favicon\\.ico$).*)"],
};
