// Pemeriksaan awal (optimistic) sebelum halaman dirender: hanya membaca cookie, tanpa database.
// Pemeriksaan sebenarnya tetap dilakukan di server lewat `requireRole` (src/lib/dal.ts).
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/jwt";
import { ROLE_HOME, roleForPath } from "@/lib/roles";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/") {
    const target = session ? ROLE_HOME[session.role] : "/login";
    return NextResponse.redirect(new URL(target, request.url));
  }

  const requiredRole = roleForPath(pathname);
  if (!requiredRole) return NextResponse.next();

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (session.role !== requiredRole) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/guru/:path*", "/siswa/:path*", "/orang-tua/:path*"],
};
