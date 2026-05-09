"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { slugify } from "@/lib/format";
import { emit, NotificationTypes } from "@/lib/notifications";

const idSchema = z.string().min(1);
const reasonSchema = z.string().max(500).optional();

export async function approveVendorAction(vendorId: string) {
  await requireAdmin();
  idSchema.parse(vendorId);
  const vendor = await prisma.vendorProfile.update({
    where: { id: vendorId },
    data: { status: "VERIFIED", rejectionReason: null },
  });
  await emit({
    type: NotificationTypes.VENDOR_APPROVED,
    recipientId: vendor.userId,
    payload: { vendorId },
  });
  revalidatePath("/admin/vendors");
  return { ok: true } as const;
}

export async function rejectVendorAction(vendorId: string, reason: string) {
  await requireAdmin();
  idSchema.parse(vendorId);
  const vendor = await prisma.vendorProfile.update({
    where: { id: vendorId },
    data: { status: "REJECTED", rejectionReason: reasonSchema.parse(reason) ?? "" },
  });
  await emit({
    type: NotificationTypes.VENDOR_REJECTED,
    recipientId: vendor.userId,
    payload: { vendorId, reason },
  });
  revalidatePath("/admin/vendors");
  return { ok: true } as const;
}

export async function approveChurchAction(churchId: string) {
  await requireAdmin();
  const church = await prisma.churchBranch.update({
    where: { id: churchId },
    data: { status: "APPROVED", rejectionReason: null },
  });
  await emit({
    type: NotificationTypes.CHURCH_APPROVED,
    recipientId: church.adminUserId,
    payload: { churchId },
  });
  revalidatePath("/admin/churches");
  return { ok: true } as const;
}

export async function rejectChurchAction(churchId: string, reason: string) {
  await requireAdmin();
  const church = await prisma.churchBranch.update({
    where: { id: churchId },
    data: { status: "REJECTED", rejectionReason: reason },
  });
  await emit({
    type: NotificationTypes.CHURCH_REJECTED,
    recipientId: church.adminUserId,
    payload: { churchId, reason },
  });
  revalidatePath("/admin/churches");
  return { ok: true } as const;
}

export async function createCategoryAction(name: string) {
  await requireAdmin();
  if (!name.trim()) return { error: "Name required" };
  await prisma.productCategory.create({
    data: { name: name.trim(), slug: slugify(name) },
  });
  revalidatePath("/admin/categories");
  return { ok: true } as const;
}

export async function toggleCategoryAction(id: string) {
  await requireAdmin();
  const cat = await prisma.productCategory.findUnique({ where: { id } });
  if (!cat) return { error: "Not found" };
  await prisma.productCategory.update({
    where: { id },
    data: { active: !cat.active },
  });
  revalidatePath("/admin/categories");
  return { ok: true } as const;
}

export async function resolveDisputeAction(
  disputeId: string,
  resolution: string,
  status: "RESOLVED" | "REJECTED"
) {
  await requireAdmin();
  await prisma.dispute.update({
    where: { id: disputeId },
    data: { resolution, status, resolvedAt: new Date() },
  });
  revalidatePath("/admin/disputes");
  return { ok: true } as const;
}
