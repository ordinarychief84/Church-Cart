export const NotificationTypes = {
  ORDER_PLACED: "order.placed",
  PAYMENT_CONFIRMED: "payment.confirmed",
  ORDER_SHIPPED: "order.shipped",
  ORDER_ARRIVED_AT_CHURCH: "order.arrived_at_church",
  ORDER_READY_FOR_PICKUP: "order.ready_for_pickup",
  ORDER_PICKED_UP: "order.picked_up",
  ORDER_FAILED_PICKUP: "order.failed_pickup",
  ORDER_DELIVERED: "order.delivered",
  ORDER_CANCELLED: "order.cancelled",
  DISPUTE_CREATED: "dispute.created",
  DISPUTE_RESOLVED: "dispute.resolved",
  VENDOR_APPROVED: "vendor.approved",
  VENDOR_REJECTED: "vendor.rejected",
  CHURCH_APPROVED: "church.approved",
  CHURCH_REJECTED: "church.rejected",
} as const;

export type NotificationType = (typeof NotificationTypes)[keyof typeof NotificationTypes];

export const NOTIFICATION_TITLES: Record<NotificationType, string> = {
  "order.placed": "Order placed",
  "payment.confirmed": "Payment confirmed",
  "order.shipped": "Order shipped",
  "order.arrived_at_church": "Package arrived at your church",
  "order.ready_for_pickup": "Ready for pickup",
  "order.picked_up": "Order picked up",
  "order.failed_pickup": "Pickup failed",
  "order.delivered": "Order delivered",
  "order.cancelled": "Order cancelled",
  "dispute.created": "Dispute opened",
  "dispute.resolved": "Dispute resolved",
  "vendor.approved": "Vendor account approved",
  "vendor.rejected": "Vendor account rejected",
  "church.approved": "Church branch approved",
  "church.rejected": "Church branch rejected",
};
