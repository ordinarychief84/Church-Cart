import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChurchIcon, MapPin, Phone, User as UserIcon } from "lucide-react";
import { requireRole } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, OrderStatusPill } from "@/components/ui";
import { formatDate, formatNaira } from "@/lib/format";
import { DENOMINATION_LABELS } from "@/lib/validation";
import type {
  ChurchBranch,
  Order,
  OrderItem,
  OrderStatus,
  Profile,
  Seller,
} from "@/lib/supabase/types";
import { SellerTransitionButton } from "./TransitionButton";

export const dynamic = "force-dynamic";

type LoadedOrder = Order & {
  items: Pick<OrderItem, "id" | "title" | "price_kobo" | "quantity">[];
  buyer: Pick<Profile, "full_name" | "phone"> | null;
  branch: Pick<
    ChurchBranch,
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
};

const STATUS_HINT: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Waiting on the buyer to complete payment. You'll be notified the moment it lands.",
  PAID: "Buyer has paid. Pack the order and mark it as processing.",
  PROCESSING: "Hand the package to your courier. Mark as shipped so the branch and member are notified.",
  SHIPPED: "On the way to the church. They'll confirm when it arrives.",
  ARRIVED_AT_CHURCH: "The branch has the package. The member will collect it.",
  READY_FOR_PICKUP: "The branch has the package. The member will collect it.",
  PICKED_UP: "Member has picked up the order.",
  DELIVERED: "Order delivered.",
  COMPLETED: "Completed.",
  FAILED_PICKUP: "Pickup failed at the branch.",
  CANCELLED: "Order cancelled.",
};

export default async function SellerOrderDetail({ params }: { params: { id: string } }) {
  const user = await requireRole("SELLER");
  const supabase = createSupabaseServerClient();

  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<Pick<Seller, "id">>();
  if (!seller) notFound();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `*,
       items:order_items ( id, title, price_kobo, quantity ),
       buyer:profiles ( full_name, phone ),
       branch:church_branches (
         denomination, branch_name, address, city, state,
         contact_person, contact_phone, operating_days, operating_hours
       )`
    )
    .eq("id", params.id)
    .eq("seller_id", seller.id)
    .maybeSingle<LoadedOrder>();

  if (!order) notFound();

  return (
    <div>
      <Link
        href="/seller/orders"
        className="inline-flex items-center gap-1 text-body-sm text-[color:var(--cp-cocoa-mid)] hover:text-[color:var(--cp-gold)]"
      >
        <ArrowLeft size={14} /> Back to orders
      </Link>

      <header className="mt-3 flex flex-col gap-1 border-b border-[color:var(--cp-rule)] pb-4">
        <p className="text-label text-[color:var(--cp-cocoa-mid)]">Order</p>
        <h1 className="text-h1 text-[color:var(--cp-cocoa-deep)]">
          <span className="text-mono text-2xl">#{order.id.slice(-6).toUpperCase()}</span>
        </h1>
        <p className="text-body-sm text-[color:var(--cp-cocoa-mid)]">
          Placed {formatDate(order.created_at)}
        </p>
        <div className="mt-1">
          <OrderStatusPill status={order.status} />
        </div>
      </header>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
            <Row
              label="Platform fee (5%)"
              value={`− ${formatNaira(order.platform_fee_kobo)}`}
            />
            <Row label="Pickup fee" value={formatNaira(order.logistics_fee_kobo)} />
            <div className="mt-1 flex items-center justify-between border-t border-[color:var(--cp-rule)] pt-2 font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
              <span>Buyer paid</span>
              <span>{formatNaira(order.total_kobo)}</span>
            </div>
            <div className="flex items-center justify-between text-[color:var(--cp-success)]">
              <span>You receive</span>
              <span className="font-editorial font-bold">
                {formatNaira(order.subtotal_kobo - order.platform_fee_kobo)}
              </span>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="text-h3 text-[color:var(--cp-cocoa-deep)]">Member</h2>
            <p className="mt-2 inline-flex items-center gap-1 text-body-sm text-[color:var(--cp-cocoa-deep)]">
              <UserIcon size={12} /> {order.buyer?.full_name ?? "—"}
            </p>
            {order.buyer?.phone && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-tag text-[color:var(--cp-cocoa-mid)]">
                <Phone size={11} /> {order.buyer.phone}
              </p>
            )}
          </Card>

          {order.branch && (
            <Card>
              <h2 className="text-h3 text-[color:var(--cp-cocoa-deep)]">Ship to branch</h2>
              <p className="mt-2 inline-flex items-center gap-1 font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
                <ChurchIcon size={12} className="text-[color:var(--cp-gold)]" />
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
                {order.branch.operating_days} · {order.branch.operating_hours}
              </p>
            </Card>
          )}

          <Card>
            <h2 className="text-h3 text-[color:var(--cp-cocoa-deep)]">Next step</h2>
            <p className="mt-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">
              {STATUS_HINT[order.status]}
            </p>
            <div className="mt-3">
              {order.status === "PAID" && (
                <SellerTransitionButton orderId={order.id} variant="PROCESSING" />
              )}
              {order.status === "PROCESSING" && (
                <SellerTransitionButton orderId={order.id} variant="SHIPPED" />
              )}
            </div>
          </Card>
        </div>
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
