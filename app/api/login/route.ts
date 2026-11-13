import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, safeEqual, sessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const password = process.env.SITE_PASSWORD;
  const form = await req.formData().catch(() => null);
  const given = form?.get("password");
  const ok = !!password && typeof given === "string" && safeEqual(await sessionToken(given), await sessionToken(password));
  if (!ok) {
    // Lille pause, så det ikke kan betale sig at gætte løs
    await new Promise((r) => setTimeout(r, 700));
    return NextResponse.redirect(new URL("/login?fejl", req.url), 303);
  }
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.set(SESSION_COOKIE, await sessionToken(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
