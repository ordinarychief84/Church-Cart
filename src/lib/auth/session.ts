import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Role } from "@prisma/client";

const SECRET = new TextEncoder().encode(env.JWT_SECRET);
const ALG = "HS256";
const TTL_DAYS = 30;

export type SessionPayload = {
  uid: string;
  role: Role;
};

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ uid: payload.uid, role: payload.role })
    .setProtectedHeader({ alg: ALG })
    .setIssuer(env.JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${TTL_DAYS}d`)
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { issuer: env.JWT_ISSUER });
    if (typeof payload.uid !== "string" || typeof payload.role !== "string") return null;
    return { uid: payload.uid, role: payload.role as Role };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  cookies().set({
    name: env.COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * TTL_DAYS,
    domain: env.COOKIE_DOMAIN || undefined,
  });
}

export async function clearSessionCookie(): Promise<void> {
  cookies().set({
    name: env.COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
    domain: env.COOKIE_DOMAIN || undefined,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = cookies().get(env.COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}
