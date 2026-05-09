"use server";

import { redirect } from "next/navigation";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signSession, setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/rbac";
import { registerSchema, loginSchema } from "@/lib/validation/auth";

export type FormState = { error?: string; fieldErrors?: Record<string, string[]> };

/**
 * Only allow same-origin relative paths in redirect targets, to prevent open
 * redirects via ?from=https://evil.example.com. Returns null for unsafe input.
 */
function safeRelativePath(p: string | null | undefined): string | null {
  if (!p) return null;
  if (typeof p !== "string") return null;
  // Must start with a single slash and not be a protocol-relative or backslash trick.
  if (!p.startsWith("/")) return null;
  if (p.startsWith("//") || p.startsWith("/\\")) return null;
  return p;
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: ((formData.get("email") as string) || "").trim(),
    phone: ((formData.get("phone") as string) || "").trim(),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const { fullName, email, phone, password, role } = parsed.data;

  // Cheap pre-check (best effort; the unique constraint catch below is the
  // authoritative defense against TOCTOU races).
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    },
  });
  if (existing) return { error: "An account with that email or phone already exists." };

  let user;
  try {
    user = await prisma.user.create({
      data: {
        fullName,
        email: email ? email.toLowerCase() : null,
        phone: phone || null,
        passwordHash: await hashPassword(password),
        role: role as Role,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = (e.meta?.target as string[] | undefined)?.[0];
      return {
        error:
          target === "email"
            ? "An account with that email already exists."
            : target === "phone"
            ? "An account with that phone already exists."
            : "An account with those details already exists.",
      };
    }
    throw e;
  }

  if (user.role === Role.BUYER) {
    await prisma.cart.create({ data: { userId: user.id } });
  }

  const token = await signSession({ uid: user.id, role: user.role });
  await setSessionCookie(token);

  // Vendors and church admins still need to complete a profile after sign-up.
  if (user.role === Role.VENDOR) redirect("/vendor/settings");
  if (user.role === Role.CHURCH_ADMIN) redirect("/church/settings");
  redirect(ROLE_HOME[user.role]);
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const { identifier, password } = parsed.data;
  const isEmail = identifier.includes("@");
  const user = await prisma.user.findFirst({
    where: isEmail ? { email: identifier } : { phone: identifier },
  });
  if (!user) return { error: "Invalid credentials" };
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "Invalid credentials" };

  const token = await signSession({ uid: user.id, role: user.role });
  await setSessionCookie(token);

  const requested = safeRelativePath(formData.get("from") as string | null);
  redirect(requested ?? ROLE_HOME[user.role]);
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}
