import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const STAFF_SESSION_COOKIE = "8e_invoicing_session";
const PORTAL_SESSION_COOKIE = "8e_portal_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/invoicing")) {
    if (pathname === "/invoicing/login") {
      const session = request.cookies.get(STAFF_SESSION_COOKIE);
      if (session?.value) {
        return NextResponse.redirect(new URL("/invoicing", request.url));
      }
      return NextResponse.next();
    }

    const session = request.cookies.get(STAFF_SESSION_COOKIE);
    if (!session?.value) {
      const loginUrl = new URL("/invoicing/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/portal")) {
    if (pathname === "/portal/login") {
      const session = request.cookies.get(PORTAL_SESSION_COOKIE);
      if (session?.value) {
        return NextResponse.redirect(new URL("/portal", request.url));
      }
      return NextResponse.next();
    }

    const session = request.cookies.get(PORTAL_SESSION_COOKIE);
    if (!session?.value) {
      return NextResponse.redirect(new URL("/portal/login", request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/invoicing/:path*", "/portal/:path*"],
};
