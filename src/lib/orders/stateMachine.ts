import { OrderStatus, DeliveryType } from "@prisma/client";
import { NotificationTypes, type NotificationType } from "@/lib/notifications/events";

export class OrderTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderTransitionError";
  }
}

export type OrderShape = {
  id: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  buyerId: string;
  vendorId: string;
  churchBranchId: string | null;
};

export type ActorRef = { kind: "user"; id: string; role: string } | { kind: "system" };

export type Action =
  | { type: "BUYER_CANCEL"; actor: ActorRef }
  | { type: "PAYMENT_VERIFIED"; actor: ActorRef }
  | { type: "PAYMENT_FAILED"; actor: ActorRef }
  | { type: "VENDOR_PROCESSING"; actor: ActorRef }
  | { type: "VENDOR_SHIPPED"; actor: ActorRef }
  | { type: "CHURCH_ARRIVED"; actor: ActorRef }
  | { type: "CHURCH_READY"; actor: ActorRef }
  | { type: "CHURCH_PICKED_UP"; actor: ActorRef }
  | { type: "CHURCH_FAILED_PICKUP"; actor: ActorRef; reason: string }
  | { type: "HOME_DELIVERED"; actor: ActorRef }
  | { type: "OPEN_DISPUTE"; actor: ActorRef }
  | { type: "MARK_COMPLETED"; actor: ActorRef }
  | { type: "ADMIN_OVERRIDE"; actor: ActorRef; toStatus: OrderStatus };

export type SideEffect =
  | { kind: "notify"; recipientId: string; type: NotificationType; payload: Record<string, unknown> }
  | { kind: "create_payout" }
  | { kind: "restock" }
  | { kind: "set_paid_at" }
  | { kind: "set_delivered_at" }
  | { kind: "set_picked_up_at" };

export type TransitionResult = {
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  sideEffects: SideEffect[];
  note?: string;
};

function notify(
  recipientId: string,
  type: NotificationType,
  payload: Record<string, unknown> = {}
): SideEffect {
  return { kind: "notify", recipientId, type, payload };
}

export function transitionOrderStatus(order: OrderShape, action: Action): TransitionResult {
  const from = order.status;
  const sideEffects: SideEffect[] = [];

  switch (action.type) {
    case "BUYER_CANCEL": {
      if (from !== OrderStatus.PENDING_PAYMENT && from !== OrderStatus.PAID) {
        throw new OrderTransitionError(`Cannot cancel from ${from}`);
      }
      sideEffects.push({ kind: "restock" });
      sideEffects.push(notify(order.buyerId, NotificationTypes.ORDER_CANCELLED, { orderId: order.id }));
      return { fromStatus: from, toStatus: OrderStatus.CANCELLED, sideEffects };
    }

    case "PAYMENT_VERIFIED": {
      if (from !== OrderStatus.PENDING_PAYMENT) {
        throw new OrderTransitionError(`Cannot verify payment from ${from}`);
      }
      sideEffects.push({ kind: "set_paid_at" });
      sideEffects.push(notify(order.buyerId, NotificationTypes.PAYMENT_CONFIRMED, { orderId: order.id }));
      return { fromStatus: from, toStatus: OrderStatus.PAID, sideEffects };
    }

    case "PAYMENT_FAILED": {
      if (from !== OrderStatus.PENDING_PAYMENT) {
        throw new OrderTransitionError(`Cannot fail payment from ${from}`);
      }
      sideEffects.push({ kind: "restock" });
      return { fromStatus: from, toStatus: OrderStatus.CANCELLED, sideEffects };
    }

    case "VENDOR_PROCESSING": {
      if (from !== OrderStatus.PAID) {
        throw new OrderTransitionError(`Cannot process from ${from}`);
      }
      return { fromStatus: from, toStatus: OrderStatus.PROCESSING, sideEffects };
    }

    case "VENDOR_SHIPPED": {
      if (from !== OrderStatus.PROCESSING) {
        throw new OrderTransitionError(`Cannot ship from ${from}`);
      }
      sideEffects.push(notify(order.buyerId, NotificationTypes.ORDER_SHIPPED, { orderId: order.id }));
      return { fromStatus: from, toStatus: OrderStatus.SHIPPED, sideEffects };
    }

    case "CHURCH_ARRIVED": {
      if (order.deliveryType !== DeliveryType.CHURCH_PICKUP) {
        throw new OrderTransitionError("Not a church pickup order");
      }
      if (from !== OrderStatus.SHIPPED) {
        throw new OrderTransitionError(`Cannot mark arrived from ${from}`);
      }
      sideEffects.push(
        notify(order.buyerId, NotificationTypes.ORDER_ARRIVED_AT_CHURCH, { orderId: order.id })
      );
      return { fromStatus: from, toStatus: OrderStatus.ARRIVED_AT_CHURCH, sideEffects };
    }

    case "CHURCH_READY": {
      if (from !== OrderStatus.ARRIVED_AT_CHURCH) {
        throw new OrderTransitionError(`Cannot mark ready from ${from}`);
      }
      sideEffects.push(
        notify(order.buyerId, NotificationTypes.ORDER_READY_FOR_PICKUP, { orderId: order.id })
      );
      return { fromStatus: from, toStatus: OrderStatus.READY_FOR_PICKUP, sideEffects };
    }

    case "CHURCH_PICKED_UP": {
      if (from !== OrderStatus.READY_FOR_PICKUP) {
        throw new OrderTransitionError(`Cannot mark picked up from ${from}`);
      }
      sideEffects.push({ kind: "set_picked_up_at" });
      sideEffects.push({ kind: "create_payout" });
      sideEffects.push(notify(order.buyerId, NotificationTypes.ORDER_PICKED_UP, { orderId: order.id }));
      return { fromStatus: from, toStatus: OrderStatus.PICKED_UP, sideEffects };
    }

    case "CHURCH_FAILED_PICKUP": {
      if (from !== OrderStatus.READY_FOR_PICKUP && from !== OrderStatus.ARRIVED_AT_CHURCH) {
        throw new OrderTransitionError(`Cannot fail pickup from ${from}`);
      }
      sideEffects.push(
        notify(order.buyerId, NotificationTypes.ORDER_FAILED_PICKUP, {
          orderId: order.id,
          reason: action.reason,
        })
      );
      return {
        fromStatus: from,
        toStatus: OrderStatus.FAILED_PICKUP,
        sideEffects,
        note: action.reason,
      };
    }

    case "HOME_DELIVERED": {
      if (order.deliveryType !== DeliveryType.HOME_DELIVERY) {
        throw new OrderTransitionError("Not a home delivery order");
      }
      if (from !== OrderStatus.SHIPPED) {
        throw new OrderTransitionError(`Cannot mark delivered from ${from}`);
      }
      sideEffects.push({ kind: "set_delivered_at" });
      sideEffects.push({ kind: "create_payout" });
      sideEffects.push(notify(order.buyerId, NotificationTypes.ORDER_DELIVERED, { orderId: order.id }));
      return { fromStatus: from, toStatus: OrderStatus.DELIVERED, sideEffects };
    }

    case "OPEN_DISPUTE": {
      if (from !== OrderStatus.PICKED_UP && from !== OrderStatus.DELIVERED) {
        throw new OrderTransitionError(`Cannot dispute from ${from}`);
      }
      return { fromStatus: from, toStatus: OrderStatus.DISPUTED, sideEffects };
    }

    case "MARK_COMPLETED": {
      if (from !== OrderStatus.PICKED_UP && from !== OrderStatus.DELIVERED) {
        throw new OrderTransitionError(`Cannot complete from ${from}`);
      }
      return { fromStatus: from, toStatus: OrderStatus.COMPLETED, sideEffects };
    }

    case "ADMIN_OVERRIDE": {
      return { fromStatus: from, toStatus: action.toStatus, sideEffects, note: "admin override" };
    }
  }
}
