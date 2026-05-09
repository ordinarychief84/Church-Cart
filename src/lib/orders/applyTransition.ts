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
 */
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

    await tx.order.update({
      where: { id: order.id },
      data: { status: result.toStatus },
    });

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
      await tx.payout.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          vendorId: order.vendorId,
          amountKobo: order.vendorAmountKobo,
          eligibleAt,
        },
        update: { eligibleAt },
      });
      return;
    }

    case "restock": {
      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
      for (const item of items) {
        await tx.product.update({
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
