import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths that don't require authentication
// Updated: 2024-03-28 - Added /agent-apply for agent recruitment (force rebuild)
// Force cache invalidation: v2
const PUBLIC_PATHS = ["/login", "/apply", "/agent-apply", "/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  const session = request.cookies.get("vault_session")?.value;

  if (!isPublic && session !== "authenticated") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && session === "authenticated") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
