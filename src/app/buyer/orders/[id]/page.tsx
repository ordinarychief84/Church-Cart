import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ChurchIcon,
  CircleCheck,
  CircleDashed,
  CreditCard,
  MapPin,
  Phone,
} from "lucide-react";
import { requireRole } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { simulatePaystackPaymentAction } from "@/app/actions/buyer";
import { Card, OrderStatusPill } from "@/components/ui";
import { formatDate, formatNaira } from "@/lib/format";
import { DENOMINATION_LABELS } from "@/lib/validation";
import type {
  ChurchBranch,
  Order,
  OrderItem,
  OrderStatus,
  Seller,
} from "@/lib/supabase/types";
import { OrderRealtime } from "./OrderRealtime";

export const dynamic = "force-dynamic";

type LoadedOrder = Order & {
  items: Pick<OrderItem, "id" | "title" | "price_kobo" | "quantity">[];
  branch: Pick<
    ChurchBranch,
    | "id"
    | "denomination"
    | "branch_name"
    | "address"
    | "city"
    | "state"
    | "contact_person"
    | "contact_phone"
    | "operating_days"
    | "operating_hours"
  > | null;
  seller: Pick<Seller, "business_name" | "slug"> | null;
};

const PICKUP_FLOW: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "ARRIVED_AT_CHURCH",
  "READY_FOR_PICKUP",
  "PICKED_UP",
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  PROCESSING: "Seller is preparing",
  SHIPPED: "On the way to your church",
  ARRIVED_AT_CHURCH: "Arrived at church",
  READY_FOR_PICKUP: "Ready for pickup",
  PICKED_UP: "Picked up",
  DELIVERED: "Delivered",
  FAILED_PICKUP: "Pickup failed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export default async function BuyerOrderDetail({ params }: { params: { id: string } }) {
  const user = await requireRole("BUYER");
  const supabase = createSupabaseServerClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `*,
       items:order_items ( id, title, price_kobo, quantity ),
       branch:church_branches (
         id, denomination, branch_name, address, city, state,
         contact_person, contact_phone, operating_days, operating_hours
       ),
       seller:sellers ( business_name, slug )`
    )
    .eq("id", params.id)
    .eq("buyer_id", user.id)
    .maybeSingle<LoadedOrder>();

  if (!order) notFound();

  const isCancelled = order.status === "CANCELLED";
  const isFailed = order.status === "FAILED_PICKUP";
  const currentIdx = PICKUP_FLOW.indexOf(order.status);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <OrderRealtime orderId={order.id} />

      <Link
        href="/buyer"
        className="inline-flex items-center gap-1 text-body-sm text-[color:var(--cp-cocoa-mid)] transition-colors hover:text-[color:var(--cp-gold)]"
      >
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      <header className="mt-3 flex flex-col gap-1 border-b border-[color:var(--cp-rule)] pb-4">
        <p className="text-label text-[color:var(--cp-cocoa-mid)]">Order</p>
        <h1 className="text-h1 text-[color:var(--cp-cocoa-deep)]">
          <span className="text-mono text-2xl">#{order.id.slice(-6).toUpperCase()}</span>
        </h1>
        <p className="text-body-sm text-[color:var(--cp-cocoa-mid)]">
          Placed {formatDate(order.created_at)} from {order.seller?.business_name ?? "—"}
        </p>
        <div className="mt-1">
          <OrderStatusPill status={order.status} />
        </div>
      </header>

      {order.status === "PENDING_PAYMENT" && (
        <Card className="mt-4" variant="surface">
          <p className="font-editorial text-base font-bold text-[color:var(--cp-cocoa-deep)]">
            Awaiting payment
          </p>
          <p className="mt-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">
            Your order is reserved. Complete payment to confirm it with the seller and your branch.
          </p>
          <form action={simulatePaystackPaymentAction} className="mt-3">
            <input type="hidden" name="order_id" value={order.id} />
            <button type="submit" className="btn-primary cp-btn-md">
              <CreditCard size={14} />
              Pay with Paystack · {formatNaira(order.total_kobo)}
            </button>
          </form>
          <p className="mt-2 text-tag text-[color:var(--cp-cocoa-mid)]">
            Demo only — this simulates a successful Paystack charge.
          </p>
        </Card>
      )}

      {(isCancelled || isFailed) && (
        <Card
          className="mt-4"
          style={
            isFailed
              ? { background: "#FEEFE9", borderColor: "#F4B7A8", color: "#842029" }
              : undefined
          }
        >
          <p className="font-editorial font-bold">{STATUS_LABEL[order.status]}</p>
        </Card>
      )}

      {!isCancelled && (
        <Card className="mt-6">
          <h2 className="text-h3 text-[color:var(--cp-cocoa-deep)]">Status</h2>
          <ol className="mt-3 space-y-2">
            {PICKUP_FLOW.map((step, idx) => {
              const done = currentIdx >= idx;
              const active = currentIdx === idx;
              return (
                <li key={step} className="flex items-center gap-3 text-body-sm">
                  {done ? (
                    <CircleCheck
                      size={16}
                      className={
                        active
                          ? "text-[color:var(--cp-gold)]"
                          : "text-[color:var(--cp-success)]"
                      }
                    />
                  ) : (
                    <CircleDashed size={16} className="text-[color:var(--cp-sand-dark)]" />
                  )}
                  <span
                    className={
                      done
                        ? active
                          ? "font-editorial font-bold text-[color:var(--cp-cocoa-deep)]"
                          : "text-[color:var(--cp-cocoa-deep)]"
                        : "text-[color:var(--cp-mid)]"
                    }
                  >
                    {STATUS_LABEL[step]}
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-h3 text-[color:var(--cp-cocoa-deep)]">Items</h2>
          <ul className="mt-2 divide-y divide-[color:var(--cp-rule)]">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-3 py-2 text-body-sm">
                <div>
                  <p className="font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
                    {it.title}
                  </p>
                  <p className="text-tag text-[color:var(--cp-cocoa-mid)]">Qty {it.quantity}</p>
                </div>
                <span className="font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
                  {formatNaira(it.price_kobo * it.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">
            <Row label="Subtotal" value={formatNaira(order.subtotal_kobo)} />
            <Row label="Pickup fee" value={formatNaira(order.logistics_fee_kobo)} />
            <div className="mt-1 flex items-center justify-between border-t border-[color:var(--cp-rule)] pt-2 font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
              <span>Total</span>
              <span>{formatNaira(order.total_kobo)}</span>
            </div>
          </div>
        </Card>

        {order.branch && (
          <Card>
            <h2 className="text-h3 text-[color:var(--cp-cocoa-deep)]">Pickup branch</h2>
            <p className="mt-2 inline-flex items-center gap-1 font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
              <ChurchIcon size={14} className="text-[color:var(--cp-gold)]" />
              {DENOMINATION_LABELS[order.branch.denomination]} — {order.branch.branch_name}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-tag text-[color:var(--cp-cocoa-mid)]">
              <MapPin size={11} /> {order.branch.address}, {order.branch.city},{" "}
              {order.branch.state}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-tag text-[color:var(--cp-cocoa-mid)]">
              <Phone size={11} /> {order.branch.contact_person} · {order.branch.contact_phone}
            </p>
            <p className="mt-2 text-mono text-[color:var(--cp-cocoa-mid)]">
              {order.branch.operating_days}
              <br />
              {order.branch.operating_hours}
            </p>
            {order.status === "READY_FOR_PICKUP" && (
              <p
                className="mt-3 rounded-md px-3 py-2 text-body-sm font-medium"
                style={{ background: "#D4EDDA", color: "#1A5C32" }}
              >
                Your order is ready. Head to your branch during pickup hours.
              </p>
            )}
          </Card>
        )}
      </section>

      {order.paystack_reference && (
        <p className="mt-4 text-mono text-[color:var(--cp-mid)]">
          Paystack reference: {order.paystack_reference}
        </p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="text-[color:var(--cp-cocoa-deep)]">{value}</span>
    </div>
  );
}
