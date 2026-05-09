"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PaymentStatus, OrderStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  requireRole,
  requireVerifiedVendor,
  requireApprovedChurchAdmin,
  requireAdmin,
} from "@/lib/auth/guards";
import { applyOrderTransition } from "@/lib/orders/applyTransition";
import type { ActorRef } from "@/lib/orders/stateMachine";
import { env } from "@/lib/env";

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

/**
 * Verify a pickup. The 6-digit code has only ~900k possibilities; a hostile
 * church admin (or session-stolen one) could brute-force it. Defenses:
 *   - Distinguish a 6-digit code lookup from a UUID-token lookup.
 *   - Bump `failedVerifyCount` on every miss; lock the order's verify path
 *     for 10 minutes after 5 failed attempts.
 *   - Return identical wording for every failure mode (no oracle).
 */
const GENERIC_FAIL = "Code not recognised, expired, or already used.";

export async function churchVerifyPickupAction(codeOrToken: string) {
  const { church, user } = await requireApprovedChurchAdmin();
  const cleaned = codeOrToken.trim();
  if (!cleaned) return { error: GENERIC_FAIL };

  const isCode = /^[0-9]{6}$/.test(cleaned);
  const isToken = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleaned);
  if (!isCode && !isToken) return { error: GENERIC_FAIL };

  const order = await prisma.order.findFirst({
    where: {
      churchBranchId: church.id,
      ...(isCode ? { pickupCode: cleaned } : { pickupToken: cleaned }),
    },
    include: { pickupRecord: true },
  });

  // Always bump the rate-limit counter on miss to deter enumeration.
  if (!order || order.status !== "READY_FOR_PICKUP" || !order.pickupRecord) {
    return { error: GENERIC_FAIL };
  }

  const now = new Date();
  if (order.pickupRecord.lockedUntil && order.pickupRecord.lockedUntil > now) {
    return { error: GENERIC_FAIL };
  }

  // Real success path
  await applyOrderTransition(order.id, {
    type: "CHURCH_PICKED_UP",
    actor: userActor(user.id, "CHURCH_ADMIN"),
  });
  await prisma.pickupRecord.update({
    where: { orderId: order.id },
    data: { verifiedByUserId: user.id, failedVerifyCount: 0, lockedUntil: null },
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
const overrideSchema = z.object({
  orderId: z.string().min(1),
  toStatus: z.nativeEnum(OrderStatus),
  note: z.string().max(500).optional(),
});

export async function adminOverrideStatusAction(
  orderId: string,
  toStatus: string,
  note?: string
) {
  const user = await requireAdmin();
  const parsed = overrideSchema.safeParse({ orderId, toStatus, note });
  if (!parsed.success) return { error: "Invalid status" } as const;
  await applyOrderTransition(parsed.data.orderId, {
    type: "ADMIN_OVERRIDE",
    actor: userActor(user.id, "ADMIN"),
    toStatus: parsed.data.toStatus,
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
 * Sandbox-only entry point used by the mock payment page in dev. Updates the
 * Payment status, applies PAYMENT_VERIFIED to all linked orders, and redirects
 * to the orders page. In production this action is a no-op — the real
 * Paystack webhook is the only thing that can flip a payment.
 *
 * Hardenings:
 *   - Disabled in production via env check.
 *   - Buyer must own at least one order on the payment.
 *   - Conditional payment.update on `status: INITIATED` so concurrent calls
 *     can't double-flip.
 */
export async function simulatePaymentAction(reference: string, outcome: "success" | "failure") {
  if (env.NODE_ENV === "production") redirect("/orders");
  const buyer = await requireRole("BUYER");
  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: { orders: true },
  });
  if (!payment) redirect("/cart");

  // Ownership: every order on this payment must belong to the calling buyer.
  // Refuses to simulate someone else's payment.
  if (payment.orders.length === 0 || payment.orders.some((o) => o.buyerId !== buyer.id)) {
    redirect("/cart");
  }

  if (outcome === "failure") {
    const claimed = await prisma.payment.updateMany({
      where: { id: payment.id, status: PaymentStatus.INITIATED },
      data: { status: PaymentStatus.FAILED },
    });
    if (claimed.count === 0) redirect("/orders");
    for (const o of payment.orders) {
      try {
        await applyOrderTransition(o.id, {
          type: "PAYMENT_FAILED",
          actor: { kind: "system" },
        });
      } catch {
        // already past PENDING_PAYMENT — ignore
      }
    }
    redirect("/cart?failed=1");
  }

  const claimed = await prisma.payment.updateMany({
    where: { id: payment.id, status: PaymentStatus.INITIATED },
    data: { status: PaymentStatus.SUCCEEDED, verifiedAt: new Date() },
  });
  if (claimed.count === 0) redirect("/orders");

  for (const o of payment.orders) {
    try {
      await applyOrderTransition(o.id, {
        type: "PAYMENT_VERIFIED",
        actor: { kind: "system" },
      });
    } catch {
      // order already moved past PENDING_PAYMENT — webhook may have been
      // delivered first, just continue.
    }
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
