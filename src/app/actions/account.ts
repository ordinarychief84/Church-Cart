"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { normalizeNgPhone, passwordSchema } from "@/lib/validation/auth";

type Result = { ok?: true; error?: string; fieldErrors?: Record<string, string[]> };

const contactSchema = z
  .object({
    fullName: z.string().min(2).max(80),
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
  })
  .transform((d) => ({
    fullName: d.fullName.trim(),
    email: d.email ? d.email.toLowerCase().trim() : "",
    phone: d.phone ? normalizeNgPhone(d.phone.trim()) : "",
  }))
  .refine((d) => !!d.email || !!d.phone, {
    message: "You need at least one of email or phone",
    path: ["email"],
  })
  .refine(
    (d) => !d.phone || /^\+234[0-9]{10}$/.test(d.phone),
    { message: "Use a Nigerian phone like 08012345678", path: ["phone"] }
  );

export async function updateContactAction(_prev: Result, formData: FormData): Promise<Result> {
  const user = await requireUser();
  const parsed = contactSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = (e.meta?.target as string[] | undefined)?.[0];
      return {
        error:
          target === "email"
            ? "Another account already uses that email."
            : target === "phone"
            ? "Another account already uses that phone."
            : "Those details are already taken.",
      };
    }
    throw e;
  }

  revalidatePath("/account");
  return { ok: true };
}

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

export async function changePasswordAction(_prev: Result, formData: FormData): Promise<Result> {
  const user = await requireUser();
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const fresh = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fresh) return { error: "Account not found" };
  const ok = await verifyPassword(parsed.data.currentPassword, fresh.passwordHash);
  if (!ok) return { error: "Current password doesn't match." };

  const sameAsOld = await verifyPassword(parsed.data.newPassword, fresh.passwordHash);
  if (sameAsOld) return { error: "Pick a password different from your current one." };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });
  return { ok: true };
}
