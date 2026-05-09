import type { OrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";

const TONE: Record<OrderStatus, "neutral" | "info" | "success" | "warning" | "danger" | "gold"> = {
  PENDING_PAYMENT: "warning",
  PAID: "info",
  PROCESSING: "info",
  SHIPPED: "info",
  ARRIVED_AT_CHURCH: "gold",
  READY_FOR_PICKUP: "gold",
  PICKED_UP: "success",
  DELIVERED: "success",
  FAILED_PICKUP: "danger",
  CANCELLED: "neutral",
  RETURNED: "danger",
  DISPUTED: "danger",
  COMPLETED: "success",
};

const LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  ARRIVED_AT_CHURCH: "Arrived at church",
  READY_FOR_PICKUP: "Ready for pickup",
  PICKED_UP: "Picked up",
  DELIVERED: "Delivered",
  FAILED_PICKUP: "Failed pickup",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  DISPUTED: "Disputed",
  COMPLETED: "Completed",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONE[status]}>{LABEL[status]}</Badge>;
}
