"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireRole,
  requireVerifiedVendor,
  requireApprovedChurchAdmin,
  requireAdmin,
} from "@/lib/auth/guards";
import { applyOrderTransition } from "@/lib/orders/applyTransition";
import type { ActorRef } from "@/lib/orders/stateMachine";

function userActor(id: string, role: string): ActorRef {
  return { kind: "user", id, role };
}

// ─── Buyer ──────────────────────────────────────────────────
export async function buyerCancelOrderAction(orderId: string) {
  const user = await requireRole("BUYER");
  const order = await prisma.order.findFirst({ where: { id: orderId, buyerId: user.id } });
  if (!order) return { error: "Order not found" };
  await applyOrderTransition(orderId, { type: "BUYER_CANCEL", actor: userActor(user.id, "BUYER") });
  revalidatePath(`/orders/${orderId}`);
  return { ok: true } as const;
}

// ─── Vendor ─────────────────────────────────────────────────
export async function vendorMarkProcessingAction(orderId: string) {
  const { vendor, user } = await requireVerifiedVendor();
  const order = await prisma.order.findFirst({ where: { id: orderId, vendorId: vendor.id } });
  if (!order) return { error: "Order not found" };
  await applyOrderTransition(orderId, {
    type: "VENDOR_PROCESSING",
    actor: userActor(user.id, "VENDOR"),
  });
  revalidatePath("/vendor/orders");
  return { ok: true } as const;
}

export async function vendorMarkShippedAction(orderId: string) {
  const { vendor, user } = await requireVerifiedVendor();
  const order = await prisma.order.findFirst({ where: { id: orderId, vendorId: vendor.id } });
  if (!order) return { error: "Order not found" };
  await applyOrderTransition(orderId, {
    type: "VENDOR_SHIPPED",
    actor: userActor(user.id, "VENDOR"),
  });
  revalidatePath("/vendor/orders");
  return { ok: true } as const;
}

// ─── Church admin ───────────────────────────────────────────
export async function churchMarkArrivedAction(orderId: string) {
  const { church, user } = await requireApprovedChurchAdmin();
  const order = await prisma.order.findFirst({
    where: { id: orderId, churchBranchId: church.id },
  });
  if (!order) return { error: "Order not found" };
  await applyOrderTransition(orderId, {
    type: "CHURCH_ARRIVED",
    actor: userActor(user.id, "CHURCH_ADMIN"),
  });
  await prisma.pickupRecord.update({
    where: { orderId },
    data: { arrivedAt: new Date() },
  });
  revalidatePath("/church/packages");
  return { ok: true } as const;
}

export async function churchMarkReadyAction(orderId: string) {
  const { church, user } = await requireApprovedChurchAdmin();
  const order = await prisma.order.findFirst({
    where: { id: orderId, churchBranchId: church.id },
  });
  if (!order) return { error: "Order not found" };
  await applyOrderTransition(orderId, {
    type: "CHURCH_READY",
    actor: userActor(user.id, "CHURCH_ADMIN"),
  });
  await prisma.pickupRecord.update({
    where: { orderId },
    data: { readyAt: new Date() },
  });
  revalidatePath("/church/packages");
  return { ok: true } as const;
}

export async function churchVerifyPickupAction(codeOrToken: string) {
  const { church, user } = await requireApprovedChurchAdmin();
  const cleaned = codeOrToken.trim();
  if (!cleaned) return { error: "Enter a code" };
  const order = await prisma.order.findFirst({
    where: {
      churchBranchId: church.id,
      OR: [{ pickupCode: cleaned }, { pickupToken: cleaned }],
    },
  });
  if (!order) return { error: "No matching package at this branch." };
  if (order.status !== "READY_FOR_PICKUP") {
    return { error: `Package is ${order.status.toLowerCase().replace(/_/g, " ")}; cannot mark picked up.` };
  }
  await applyOrderTransition(order.id, {
    type: "CHURCH_PICKED_UP",
    actor: userActor(user.id, "CHURCH_ADMIN"),
  });
  await prisma.pickupRecord.update({
    where: { orderId: order.id },
    data: { verifiedByUserId: user.id },
  });
  revalidatePath("/church/packages");
  revalidatePath("/church/history");
  return { ok: true, orderId: order.id } as const;
}

export async function churchFailedPickupAction(orderId: string, reason: string) {
  const { church, user } = await requireApprovedChurchAdmin();
  const order = await prisma.order.findFirst({
    where: { id: orderId, churchBranchId: church.id },
  });
  if (!order) return { error: "Order not found" };
  await applyOrderTransition(orderId, {
    type: "CHURCH_FAILED_PICKUP",
    actor: userActor(user.id, "CHURCH_ADMIN"),
    reason,
  });
  await prisma.pickupRecord.update({
    where: { orderId },
    data: { failedAt: new Date(), failureReason: reason, outcome: "FAILED" },
  });
  revalidatePath("/church/packages");
  return { ok: true } as const;
}

// ─── Admin ──────────────────────────────────────────────────
export async function adminOverrideStatusAction(
  orderId: string,
  toStatus: string,
  note?: string
) {
  const user = await requireAdmin();
  await applyOrderTransition(orderId, {
    type: "ADMIN_OVERRIDE",
    actor: userActor(user.id, "ADMIN"),
    toStatus: toStatus as never,
  });
  revalidatePath("/admin/orders");
  return { ok: true } as const;
}

export async function adminMarkHomeDeliveredAction(orderId: string) {
  const user = await requireAdmin();
  await applyOrderTransition(orderId, { type: "HOME_DELIVERED", actor: userActor(user.id, "ADMIN") });
  revalidatePath("/admin/orders");
  return { ok: true } as const;
}

// ─── Mock payment simulator ─────────────────────────────────
/**
 * Sandbox-only entry point used by the mock payment page. Updates the Payment
 * status, applies PAYMENT_VERIFIED to all linked orders, and redirects to the
 * orders page. In production this is replaced by Paystack's webhook.
 */
export async function simulatePaymentAction(reference: string, outcome: "success" | "failure") {
  await requireRole("BUYER");
  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: { orders: true },
  });
  if (!payment) redirect("/cart");

  if (payment.status !== PaymentStatus.INITIATED) {
    redirect("/orders");
  }

  if (outcome === "failure") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });
    for (const o of payment.orders) {
      await applyOrderTransition(o.id, {
        type: "PAYMENT_FAILED",
        actor: { kind: "system" },
      });
    }
    redirect("/cart?failed=1");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.SUCCEEDED, verifiedAt: new Date() },
  });
  for (const o of payment.orders) {
    await applyOrderTransition(o.id, {
      type: "PAYMENT_VERIFIED",
      actor: { kind: "system" },
    });
  }
  redirect(`/orders/${payment.orders[0]?.id ?? ""}`);
}

// ─── Disputes ───────────────────────────────────────────────
export async function openDisputeAction(orderId: string, reason: string, description: string) {
  const user = await requireRole("BUYER");
  const order = await prisma.order.findFirst({ where: { id: orderId, buyerId: user.id } });
  if (!order) return { error: "Order not found" };
  if (order.status !== "PICKED_UP" && order.status !== "DELIVERED") {
    return { error: "You can only dispute completed orders." };
  }
  await prisma.dispute.create({
    data: { orderId, openedById: user.id, reason, description },
  });
  await applyOrderTransition(orderId, {
    type: "OPEN_DISPUTE",
    actor: userActor(user.id, "BUYER"),
  });
  revalidatePath(`/orders/${orderId}`);
  return { ok: true } as const;
}
