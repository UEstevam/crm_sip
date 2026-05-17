import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "crm-auth";
const PUBLIC_FILE = /\.(.*)$/;
const LOGIN_PATH = "/login";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === LOGIN_PATH ||
    pathname.startsWith("/favicon.ico") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const authCookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (authCookie === "1") {
    return NextResponse.next();
  }

  const loginUrl = new URL(LOGIN_PATH, req.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
