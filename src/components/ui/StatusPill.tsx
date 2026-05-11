import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/supabase/types";

type Tone = "ready" | "pending" | "transit" | "failed" | "success";

const TONE: Record<Tone, string> = {
  ready: "status-ready",
  pending: "status-pending",
  transit: "status-transit",
  failed: "status-failed",
  success: "status-success",
};

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  children: ReactNode;
}

export function StatusPill({ tone = "pending", className, children, ...rest }: StatusPillProps) {
  return (
    <span className={cn("status-pill", TONE[tone], className)} {...rest}>
      {children}
    </span>
  );
}

/**
 * Map an OrderStatus enum to its brand-correct tone + label. Used in seller/
 * buyer/church order lists so the pill colours stay consistent across roles.
 */
const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  PENDING_PAYMENT: "pending",
  PAID: "transit",
  PROCESSING: "transit",
  SHIPPED: "transit",
  ARRIVED_AT_CHURCH: "ready",
  READY_FOR_PICKUP: "ready",
  PICKED_UP: "success",
  DELIVERED: "success",
  COMPLETED: "success",
  FAILED_PICKUP: "failed",
  CANCELLED: "pending",
};

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  PROCESSING: "Preparing",
  SHIPPED: "On the way",
  ARRIVED_AT_CHURCH: "Arrived",
  READY_FOR_PICKUP: "Ready for pickup",
  PICKED_UP: "Picked up",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  FAILED_PICKUP: "Pickup failed",
  CANCELLED: "Cancelled",
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return <StatusPill tone={ORDER_STATUS_TONE[status]}>{ORDER_STATUS_LABEL[status]}</StatusPill>;
}
