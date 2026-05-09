import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ROLE_HOME, requiredRolesForPath } from "@/lib/rbac";
import type { Role } from "@prisma/client";

const COOKIE_NAME = process.env.COOKIE_NAME || "cc_session";
const ISSUER = process.env.JWT_ISSUER || "churchcart";
const RAW_SECRET = process.env.JWT_SECRET;
// Fail closed: if JWT_SECRET isn't configured, all sessions read as null.
// `lib/env.ts` rejects boot when missing, so this is purely defensive.
const SECRET = RAW_SECRET ? new TextEncoder().encode(RAW_SECRET) : null;

async function readSessionFromRequest(req: NextRequest): Promise<{ uid: string; role: Role } | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET, { issuer: ISSUER });
    if (typeof payload.uid === "string" && typeof payload.role === "string") {
      return { uid: payload.uid, role: payload.role as Role };
    }
  } catch {
    return null;
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const session = await readSessionFromRequest(req);

  // Auth pages: redirect to role home if already logged in
  if (pathname === "/login" || pathname === "/register") {
    if (session) {
      const url = req.nextUrl.clone();
      url.pathname = ROLE_HOME[session.role];
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const requiredRoles = requiredRolesForPath(pathname);
  if (!requiredRoles) return NextResponse.next();

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (!requiredRoles.includes(session.role)) {
    const url = req.nextUrl.clone();
    url.pathname = ROLE_HOME[session.role];
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/admin/:path*",
    "/vendor/:path*",
    "/church/:path*",
    "/dashboard/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
  ],
};
