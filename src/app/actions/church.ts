"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import { churchBranchSchema } from "@/lib/validation/church";
import { uniqueSlug } from "@/lib/format";

type Result = { ok?: true; error?: string; fieldErrors?: Record<string, string[]> };

export async function upsertChurchBranchAction(_prev: Result, formData: FormData): Promise<Result> {
  const user = await requireRole("CHURCH_ADMIN");
  const parsed = churchBranchSchema.safeParse({
    churchName: formData.get("churchName"),
    denomination: formData.get("denomination"),
    branchName: formData.get("branchName"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    contactPerson: formData.get("contactPerson"),
    contactPhone: formData.get("contactPhone"),
    operatingDays: formData.get("operatingDays"),
    operatingHours: formData.get("operatingHours"),
    pickupCapacity: formData.get("pickupCapacity") ?? 50,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const existing = await prisma.churchBranch.findUnique({ where: { adminUserId: user.id } });
  if (existing) {
    await prisma.churchBranch.update({
      where: { adminUserId: user.id },
      data: { ...parsed.data },
    });
  } else {
    await prisma.churchBranch.create({
      data: {
        ...parsed.data,
        adminUserId: user.id,
        slug: uniqueSlug(`${parsed.data.churchName} ${parsed.data.branchName}`),
      },
    });
  }
  revalidatePath("/church/settings");
  return { ok: true };
}
