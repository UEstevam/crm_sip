import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "crm-auth";
const PUBLIC_FILE = /\.(.*)$/;
const LOGIN_PATH = "/login";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Allow Next static, public assets and the login API only.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === LOGIN_PATH ||
    pathname.startsWith("/api/login") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Require auth cookie for everything else (including /api routes).
  const authCookie = req.cookies.get(AUTH_COOKIE)?.value ?? null;
  if (authCookie === "1") {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to the login page.
  const loginUrl = new URL(LOGIN_PATH, req.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
