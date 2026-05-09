"use server";

import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signSession, setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/rbac";
import { registerSchema, loginSchema } from "@/lib/validation/auth";

export type FormState = { error?: string; fieldErrors?: Record<string, string[]> };

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: (formData.get("email") as string) || "",
    phone: (formData.get("phone") as string) || "",
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const { fullName, email, phone, password, role } = parsed.data;

  // Uniqueness check (case-insensitive on email)
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        email ? { email: email.toLowerCase() } : { id: "__nope__" },
        phone ? { phone } : { id: "__nope__" },
      ],
    },
  });
  if (existing) return { error: "An account with that email or phone already exists." };

  const user = await prisma.user.create({
    data: {
      fullName,
      email: email ? email.toLowerCase() : null,
      phone: phone || null,
      passwordHash: await hashPassword(password),
      role: role as Role,
    },
  });

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
    where: isEmail ? { email: identifier.toLowerCase() } : { phone: identifier },
  });
  if (!user) return { error: "Invalid credentials" };
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "Invalid credentials" };

  const token = await signSession({ uid: user.id, role: user.role });
  await setSessionCookie(token);

  const from = (formData.get("from") as string) || ROLE_HOME[user.role];
  redirect(from);
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}
