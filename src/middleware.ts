import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "8e_invoicing_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/invoicing")) {
    return NextResponse.next();
  }

  if (pathname === "/invoicing/login") {
    const session = request.cookies.get(SESSION_COOKIE);
    if (session?.value) {
      return NextResponse.redirect(new URL("/invoicing", request.url));
    }
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE);
  if (!session?.value) {
    const loginUrl = new URL("/invoicing/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/invoicing/:path*"],
};
