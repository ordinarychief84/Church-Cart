import type { OrderStatusEvent, OrderStatus } from "@prisma/client";
import { formatDate } from "@/lib/format";

const LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Payment confirmed",
  PROCESSING: "Vendor processing",
  SHIPPED: "Shipped",
  ARRIVED_AT_CHURCH: "Arrived at church",
  READY_FOR_PICKUP: "Ready for pickup",
  PICKED_UP: "Picked up",
  DELIVERED: "Delivered",
  FAILED_PICKUP: "Pickup failed",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  DISPUTED: "Dispute opened",
  COMPLETED: "Completed",
};

export function OrderTimeline({ events }: { events: OrderStatusEvent[] }) {
  if (events.length === 0) {
    return <p className="mt-2 text-sm text-slate-500">No status changes yet.</p>;
  }
  return (
    <ol className="mt-3 space-y-3">
      {events.map((e) => (
        <li key={e.id} className="flex items-start gap-3">
          <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-brand-600" />
          <div>
            <p className="text-sm font-medium">{LABEL[e.toStatus]}</p>
            {e.note && <p className="text-xs text-slate-500">{e.note}</p>}
            <p className="text-xs text-slate-400">{formatDate(e.createdAt)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
