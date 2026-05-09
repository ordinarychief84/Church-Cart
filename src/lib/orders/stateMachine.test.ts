import { describe, it, expect } from "vitest";
import { OrderStatus, DeliveryType } from "@prisma/client";
import { transitionOrderStatus, OrderTransitionError, type OrderShape } from "./stateMachine";

const churchOrder: OrderShape = {
  id: "o1",
  status: OrderStatus.PENDING_PAYMENT,
  deliveryType: DeliveryType.CHURCH_PICKUP,
  buyerId: "b1",
  vendorId: "v1",
  churchBranchId: "c1",
};
const homeOrder = { ...churchOrder, deliveryType: DeliveryType.HOME_DELIVERY, churchBranchId: null };
const sysActor = { kind: "system" } as const;
const userActor = { kind: "user" as const, id: "u1", role: "VENDOR" };

describe("order state machine", () => {
  it("PENDING_PAYMENT -> PAID via PAYMENT_VERIFIED", () => {
    const r = transitionOrderStatus(churchOrder, { type: "PAYMENT_VERIFIED", actor: sysActor });
    expect(r.toStatus).toBe(OrderStatus.PAID);
    expect(r.sideEffects.some((s) => s.kind === "set_paid_at")).toBe(true);
  });

  it("blocks VENDOR_PROCESSING from PENDING_PAYMENT", () => {
    expect(() =>
      transitionOrderStatus(churchOrder, { type: "VENDOR_PROCESSING", actor: userActor })
    ).toThrow(OrderTransitionError);
  });

  it("PAID -> PROCESSING -> SHIPPED -> ARRIVED -> READY -> PICKED_UP (church)", () => {
    let order: OrderShape = { ...churchOrder, status: OrderStatus.PAID };
    let r = transitionOrderStatus(order, { type: "VENDOR_PROCESSING", actor: userActor });
    expect(r.toStatus).toBe(OrderStatus.PROCESSING);
    order = { ...order, status: OrderStatus.PROCESSING };
    r = transitionOrderStatus(order, { type: "VENDOR_SHIPPED", actor: userActor });
    expect(r.toStatus).toBe(OrderStatus.SHIPPED);
    order = { ...order, status: OrderStatus.SHIPPED };
    r = transitionOrderStatus(order, { type: "CHURCH_ARRIVED", actor: userActor });
    expect(r.toStatus).toBe(OrderStatus.ARRIVED_AT_CHURCH);
    order = { ...order, status: OrderStatus.ARRIVED_AT_CHURCH };
    r = transitionOrderStatus(order, { type: "CHURCH_READY", actor: userActor });
    expect(r.toStatus).toBe(OrderStatus.READY_FOR_PICKUP);
    order = { ...order, status: OrderStatus.READY_FOR_PICKUP };
    r = transitionOrderStatus(order, { type: "CHURCH_PICKED_UP", actor: userActor });
    expect(r.toStatus).toBe(OrderStatus.PICKED_UP);
    expect(r.sideEffects.some((s) => s.kind === "create_payout")).toBe(true);
  });

  it("home delivery cannot use CHURCH_ARRIVED", () => {
    const order = { ...homeOrder, status: OrderStatus.SHIPPED };
    expect(() =>
      transitionOrderStatus(order, { type: "CHURCH_ARRIVED", actor: userActor })
    ).toThrow(OrderTransitionError);
  });

  it("BUYER_CANCEL allowed at PENDING_PAYMENT and PAID, blocked at PROCESSING", () => {
    expect(
      transitionOrderStatus(
        { ...churchOrder, status: OrderStatus.PENDING_PAYMENT },
        { type: "BUYER_CANCEL", actor: userActor }
      ).toStatus
    ).toBe(OrderStatus.CANCELLED);
    expect(
      transitionOrderStatus(
        { ...churchOrder, status: OrderStatus.PAID },
        { type: "BUYER_CANCEL", actor: userActor }
      ).toStatus
    ).toBe(OrderStatus.CANCELLED);
    expect(() =>
      transitionOrderStatus(
        { ...churchOrder, status: OrderStatus.PROCESSING },
        { type: "BUYER_CANCEL", actor: userActor }
      )
    ).toThrow(OrderTransitionError);
  });

  it("FAILED_PICKUP from READY_FOR_PICKUP includes reason note", () => {
    const r = transitionOrderStatus(
      { ...churchOrder, status: OrderStatus.READY_FOR_PICKUP },
      { type: "CHURCH_FAILED_PICKUP", actor: userActor, reason: "buyer no-show" }
    );
    expect(r.toStatus).toBe(OrderStatus.FAILED_PICKUP);
    expect(r.note).toBe("buyer no-show");
  });

  it("ADMIN_OVERRIDE permits any transition", () => {
    const r = transitionOrderStatus(
      { ...churchOrder, status: OrderStatus.PROCESSING },
      { type: "ADMIN_OVERRIDE", actor: userActor, toStatus: OrderStatus.CANCELLED }
    );
    expect(r.toStatus).toBe(OrderStatus.CANCELLED);
  });
});
