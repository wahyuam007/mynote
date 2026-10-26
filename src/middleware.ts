import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isProtectedPage = pathname === "/" || pathname.startsWith("/notes");

  let isValidUser = false;
  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      isValidUser = true;
    }
  }

  // If user is already logged in and visits login/register, redirect to /
  if (isAuthPage && isValidUser) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If user is not logged in and visits protected page, redirect to /login
  if (isProtectedPage && !isValidUser) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/notes/:path*"],
};
