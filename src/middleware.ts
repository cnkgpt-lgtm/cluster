import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIK = ["/login", "/api/auth", "/api/webhooks"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublik = PUBLIK.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isPublik) return NextResponse.next();
  if (!req.auth?.user) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|.*\\.(?:png|jpg|jpeg|svg|ico)).*)"],
};
