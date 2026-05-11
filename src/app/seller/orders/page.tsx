import Link from "next/link";
import { ChurchIcon, Package } from "lucide-react";
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

export const dynamic = "force-dynamic";

type SellerOrder = Pick<
  Order,
  "id" | "status" | "total_kobo" | "created_at" | "delivery_type"
> & {
  buyer: Pick<Profile, "full_name"> | null;
  branch: Pick<ChurchBranch, "denomination" | "branch_name"> | null;
  items: Pick<OrderItem, "title" | "quantity">[];
};

const OPEN: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "ARRIVED_AT_CHURCH",
  "READY_FOR_PICKUP",
];

export default async function SellerOrdersList() {
  const user = await requireRole("SELLER");
  const supabase = createSupabaseServerClient();

  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<Pick<Seller, "id">>();

  if (!seller) {
    return (
      <div>
        <h1 className="text-h1 text-[color:var(--cp-cocoa-deep)]">Orders</h1>
        <p className="mt-2 text-body-sm text-[color:var(--cp-cocoa-mid)]">
          Set up your store first.
        </p>
      </div>
    );
  }

  const [openResp, historyResp] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `id, status, total_kobo, created_at, delivery_type,
         buyer:profiles ( full_name ),
         branch:church_branches ( denomination, branch_name ),
         items:order_items ( title, quantity )`
      )
      .eq("seller_id", seller.id)
      .in("status", OPEN as unknown as string[])
      .order("created_at", { ascending: false })
      .returns<SellerOrder[]>(),
    supabase
      .from("orders")
      .select(
        `id, status, total_kobo, created_at, delivery_type,
         buyer:profiles ( full_name ),
         branch:church_branches ( denomination, branch_name ),
         items:order_items ( title, quantity )`
      )
      .eq("seller_id", seller.id)
      .in("status", ["PICKED_UP", "DELIVERED", "FAILED_PICKUP", "CANCELLED", "COMPLETED"])
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<SellerOrder[]>(),
  ]);

  const open = openResp.data ?? [];
  const history = historyResp.data ?? [];

  return (
    <div>
      <header className="mb-6 border-b border-[color:var(--cp-rule)] pb-4">
        <p className="text-label text-[color:var(--cp-cocoa-mid)]">Seller</p>
        <h1 className="text-h1 mt-1 text-[color:var(--cp-cocoa-deep)]">Orders</h1>
        <p className="mt-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">
          Mark orders processing as soon as you start preparing, then shipped once they leave.
        </p>
      </header>

      <Section title="Open orders" count={open.length} empty="No open orders">
        {open.map((o) => (
          <OrderRow key={o.id} order={o} />
        ))}
      </Section>

      {history.length > 0 && (
        <div className="mt-8">
          <Section title="History" count={history.length} empty="">
            {history.map((o) => (
              <OrderRow key={o.id} order={o} muted />
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-h2 text-[color:var(--cp-cocoa-deep)]">
          {title}{" "}
          <span className="font-editorial font-normal text-[color:var(--cp-mid)]">· {count}</span>
        </h2>
      </div>
      {count === 0 ? (
        empty ? (
          <Card className="text-center">
            <Package className="mx-auto h-7 w-7 text-[color:var(--cp-sand-dark)]" />
            <p className="mt-2 font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
              {empty}
            </p>
            <p className="text-body-sm text-[color:var(--cp-cocoa-mid)]">
              When a member places a pickup order it shows up here.
            </p>
          </Card>
        ) : null
      ) : (
        <ul className="divide-y divide-[color:var(--cp-rule)] overflow-hidden rounded-xl border border-[color:var(--cp-rule)] bg-white">
          {children}
        </ul>
      )}
    </section>
  );
}

function OrderRow({ order, muted }: { order: SellerOrder; muted?: boolean }) {
  return (
    <li>
      <Link
        href={`/seller/orders/${order.id}`}
        className="flex items-center justify-between gap-3 px-4 py-3 text-body-sm hover:bg-[color:var(--cp-cream)]"
      >
        <div className="min-w-0">
          <p className="font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
            {order.buyer?.full_name ?? "Member"} ·{" "}
            <span className="text-mono">#{order.id.slice(-6).toUpperCase()}</span>
          </p>
          <p className="truncate text-tag text-[color:var(--cp-cocoa-mid)]">
            {order.items.length > 0
              ? order.items.map((i) => `${i.title} × ${i.quantity}`).join(", ")
              : "Order details"}
            {" · "}
            {formatDate(order.created_at)}
          </p>
          {order.branch && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-mono text-[color:var(--cp-mid)]">
              <ChurchIcon size={10} /> {DENOMINATION_LABELS[order.branch.denomination]} —{" "}
              {order.branch.branch_name}
            </p>
          )}
        </div>
        <div
          className={`flex shrink-0 items-center gap-3 ${muted ? "opacity-70" : ""}`}
        >
          <span className="font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
            {formatNaira(order.total_kobo)}
          </span>
          <OrderStatusPill status={order.status} />
        </div>
      </Link>
    </li>
  );
}
