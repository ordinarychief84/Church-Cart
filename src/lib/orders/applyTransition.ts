import { Prisma, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import {
  transitionOrderStatus,
  type Action,
  type ActorRef,
  type OrderShape,
  type SideEffect,
} from "./stateMachine";
import { emit } from "@/lib/notifications";

/**
 * Loads the order, runs the state machine, applies the new status + side
 * effects inside a single transaction, and writes the audit row.
 *
 * Concurrency safety: the actual status flip is a conditional `updateMany`
 * that only matches when the row is still in the expected `fromStatus`.
 * If two transitions race (e.g. buyer cancel + Paystack webhook verify),
 * only the first commits; the loser throws OrderTransitionStaleError so
 * the caller can choose to retry or surface "order changed" to the user.
 */
export class OrderTransitionStaleError extends Error {
  constructor(orderId: string, expected: OrderStatus) {
    super(`Order ${orderId} is no longer in ${expected}; another transition won the race.`);
    this.name = "OrderTransitionStaleError";
  }
}

export async function applyOrderTransition(
  orderId: string,
  action: Action
): Promise<{ from: OrderStatus; to: OrderStatus }> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new Error("Order not found");
    const shape: OrderShape = {
      id: order.id,
      status: order.status,
      deliveryType: order.deliveryType,
      buyerId: order.buyerId,
      vendorId: order.vendorId,
      churchBranchId: order.churchBranchId,
    };

    const result = transitionOrderStatus(shape, action);
    const actorId = (action.actor as ActorRef).kind === "user" ? (action.actor as { id: string }).id : null;

    // Conditional flip — only succeeds if status is still the value we read
    // above. Defends against concurrent transitions on the same order.
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: result.fromStatus },
      data: { status: result.toStatus },
    });
    if (updated.count === 0) {
      throw new OrderTransitionStaleError(order.id, result.fromStatus);
    }

    await tx.orderStatusEvent.create({
      data: {
        orderId: order.id,
        fromStatus: result.fromStatus,
        toStatus: result.toStatus,
        actorId,
        note: result.note ?? null,
      },
    });

    for (const fx of result.sideEffects) {
      await applySideEffect(tx, order, fx);
    }

    return { from: result.fromStatus, to: result.toStatus };
  });
}

async function applySideEffect(
  tx: Prisma.TransactionClient,
  order: { id: string; vendorId: string; vendorAmountKobo: number },
  fx: SideEffect
): Promise<void> {
  switch (fx.kind) {
    case "notify":
      await emit(
        { type: fx.type, recipientId: fx.recipientId, payload: fx.payload },
        tx
      );
      return;

    case "create_payout": {
      const eligibleAt = new Date();
      eligibleAt.setHours(eligibleAt.getHours() + env.DISPUTE_WINDOW_HOURS);
      // Don't re-extend the eligibility window if a payout already exists.
      // We could land here on ADMIN_OVERRIDE → PICKED_UP and we don't want
      // to push the vendor's payout date out.
      await tx.payout.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          vendorId: order.vendorId,
          amountKobo: order.vendorAmountKobo,
          eligibleAt,
        },
        update: {},
      });
      return;
    }

    case "restock": {
      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
      for (const item of items) {
        // Tolerate the product being soft-deleted: incrementing a missing row
        // would throw P2025 and abort the whole cancellation transaction,
        // which is worse than a slightly inaccurate inventory count.
        await tx.product.updateMany({
          where: { id: item.productId },
          data: { inventoryQty: { increment: item.quantity } },
        });
      }
      return;
    }

    case "set_paid_at":
      await tx.order.update({ where: { id: order.id }, data: { paidAt: new Date() } });
      return;

    case "set_delivered_at":
      await tx.order.update({ where: { id: order.id }, data: { deliveredAt: new Date() } });
      return;

    case "set_picked_up_at":
      await tx.order.update({
        where: { id: order.id },
        data: { pickedUpAt: new Date() },
      });
      await tx.pickupRecord.update({
        where: { orderId: order.id },
        data: { pickedUpAt: new Date(), outcome: "PICKED_UP" },
      });
      return;
  }
}
