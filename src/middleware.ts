import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIK = ["/login", "/api/auth", "/api/webhooks"];

// Middleware ringan (Edge, <1MB): hanya cek keberadaan cookie sesi.
// Verifikasi kriptografis tetap dilakukan di setiap halaman/API via auth().
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublik = PUBLIK.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isPublik) return NextResponse.next();

  const token =
    req.cookies.get("__Secure-authjs.session-token")?.value ??
    req.cookies.get("authjs.session-token")?.value;

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|.*\\.(?:png|jpg|jpeg|svg|ico)).*)"],
};
