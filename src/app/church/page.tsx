import Link from "next/link";
import {
  ChurchIcon,
  ClipboardList,
  Clock,
  MapPin,
  Package,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Truck,
} from "lucide-react";
import { requireRole } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, OrderStatusPill } from "@/components/ui";
import { formatNaira, formatDate } from "@/lib/format";
import { DENOMINATION_LABELS } from "@/lib/validation";
import type { ChurchBranch, Order, Profile } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type IncomingOrder = Pick<
  Order,
  "id" | "status" | "total_kobo" | "created_at" | "buyer_id"
> & {
  buyer: Pick<Profile, "full_name"> | null;
  items: { title: string; quantity: number }[];
};

const INCOMING_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "ARRIVED_AT_CHURCH",
  "READY_FOR_PICKUP",
] as const;

export default async function ChurchHome() {
  const user = await requireRole("CHURCH_ADMIN");
  const supabase = createSupabaseServerClient();
  const { data: branch } = await supabase
    .from("church_branches")
    .select("*")
    .eq("admin_user_id", user.id)
    .maybeSingle<ChurchBranch>();

  if (!branch) return <SetupCallout name={user.profile.full_name} />;

  const [incoming, history] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `id, status, total_kobo, created_at, buyer_id,
         buyer:profiles ( full_name ),
         items:order_items ( title, quantity )`
      )
      .eq("church_branch_id", branch.id)
      .in("status", INCOMING_STATUSES as unknown as string[])
      .order("created_at", { ascending: false })
      .returns<IncomingOrder[]>(),
    supabase
      .from("orders")
      .select(
        `id, status, total_kobo, created_at, buyer_id,
         buyer:profiles ( full_name ),
         items:order_items ( title, quantity )`
      )
      .eq("church_branch_id", branch.id)
      .in("status", ["PICKED_UP", "FAILED_PICKUP", "CANCELLED", "COMPLETED"])
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<IncomingOrder[]>(),
  ]);

  const incomingOrders = incoming.data ?? [];
  const historyOrders = history.data ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-col gap-1 border-b border-[color:var(--cp-rule)] pb-4">
        <p className="text-label text-[color:var(--cp-cocoa-mid)]">Church admin</p>
        <h1 className="text-h1 text-[color:var(--cp-cocoa-deep)]">
          {DENOMINATION_LABELS[branch.denomination]} — {branch.branch_name}
        </h1>
        <p className="inline-flex items-center gap-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">
          <MapPin size={12} /> {branch.address}, {branch.city}, {branch.state}
        </p>
        <p className="text-mono text-[color:var(--cp-mid)]">
          Pickup days: {branch.operating_days} · {branch.operating_hours} · Capacity{" "}
          {branch.pickup_capacity}
        </p>
      </header>

      {branch.status === "APPROVED" && (
        <Banner
          tone="success"
          icon={<ShieldCheck />}
          title="Kingdom Approved"
          body="Members can pick your branch as a pickup destination."
        />
      )}
      {branch.status === "PENDING" && (
        <Banner
          tone="pending"
          icon={<ShieldAlert />}
          title="Awaiting approval"
          body="Until you're approved your branch won't appear at checkout. We'll email you when it does."
        />
      )}
      {branch.status === "REJECTED" && (
        <Banner
          tone="failed"
          icon={<ShieldX />}
          title="Not approved"
          body={branch.rejection_reason ?? "Update your branch settings and re-submit."}
        />
      )}

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Incoming orders" value={incomingOrders.length} icon={<Package />} />
        <Stat label="Pickup days" value={branch.operating_days} icon={<Clock />} muted />
        <Stat
          label="Branch capacity"
          value={String(branch.pickup_capacity)}
          icon={<Truck />}
          muted
        />
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-h2 text-[color:var(--cp-cocoa-deep)]">Incoming orders</h2>
          <Link
            href="/church/manifest"
            className="inline-flex items-center gap-1 text-tag text-[color:var(--cp-gold)] hover:underline"
          >
            <ClipboardList size={12} /> Open pickup manifest →
          </Link>
        </div>
        {incomingOrders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <ul className="divide-y divide-[color:var(--cp-rule)] overflow-hidden rounded-xl border border-[color:var(--cp-rule)] bg-white">
            {incomingOrders.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </ul>
        )}
      </section>

      {historyOrders.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-h2 text-[color:var(--cp-cocoa-deep)]">Recent history</h2>
            <p className="text-tag text-[color:var(--cp-cocoa-mid)]">Last {historyOrders.length}</p>
          </div>
          <ul className="divide-y divide-[color:var(--cp-rule)] overflow-hidden rounded-xl border border-[color:var(--cp-rule)] bg-white">
            {historyOrders.map((o) => (
              <OrderRow key={o.id} order={o} muted />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function OrderRow({ order, muted }: { order: IncomingOrder; muted?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 text-body-sm">
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
      </div>
      <div className={`flex shrink-0 items-center gap-3 ${muted ? "opacity-70" : ""}`}>
        <span className="font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
          {formatNaira(order.total_kobo)}
        </span>
        <OrderStatusPill status={order.status} />
      </div>
    </li>
  );
}

function EmptyOrders() {
  return (
    <Card className="text-center">
      <Package className="mx-auto h-7 w-7 text-[color:var(--cp-sand-dark)]" />
      <p className="mt-2 font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
        No orders coming in yet
      </p>
      <p className="text-body-sm text-[color:var(--cp-cocoa-mid)]">
        When a member places a pickup order at your branch it appears here.
      </p>
    </Card>
  );
}

function SetupCallout({ name }: { name: string }) {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <header className="mb-6 border-b border-[color:var(--cp-rule)] pb-4">
        <p className="text-label text-[color:var(--cp-cocoa-mid)]">Church admin</p>
        <h1 className="text-h1 mt-1 text-[color:var(--cp-cocoa-deep)]">
          Welcome, {name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">
          Let's get your branch registered.
        </p>
      </header>
      <Card variant="surface">
        <ChurchIcon className="text-[color:var(--cp-gold)]" />
        <p className="mt-2 font-editorial text-base font-bold text-[color:var(--cp-cocoa-deep)]">
          Register your branch
        </p>
        <p className="mt-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">
          Add your branch name, denomination, address and available pickup days. A platform admin
          will review and approve — usually within 24 hours.
        </p>
        <Link href="/church/settings" className="btn-primary cp-btn-md mt-4">
          Register branch →
        </Link>
      </Card>
    </div>
  );
}

function Banner({
  tone,
  icon,
  title,
  body,
}: {
  tone: "pending" | "success" | "failed";
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const styles: Record<typeof tone, React.CSSProperties> = {
    pending: { background: "var(--cp-sand)", borderColor: "var(--cp-sand-dark)", color: "var(--cp-cocoa-deep)" },
    success: { background: "#E0F0E7", borderColor: "rgba(45,122,79,0.4)", color: "#1A5C32" },
    failed: { background: "#FEEFE9", borderColor: "#F4B7A8", color: "#842029" },
  } as const;
  return (
    <div className="flex items-start gap-3 rounded-xl border p-4 text-body-sm" style={styles[tone]}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="font-editorial font-bold">{title}</p>
        <p>{body}</p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <p className="text-label text-[color:var(--cp-cocoa-mid)]">{label}</p>
        <div
          className={`grid h-8 w-8 place-items-center rounded-md ${
            muted
              ? "bg-[color:var(--cp-sand)] text-[color:var(--cp-mid)]"
              : "bg-[color:var(--cp-sand)] text-[color:var(--cp-cocoa-deep)]"
          }`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-2 font-editorial text-2xl font-bold text-[color:var(--cp-cocoa-deep)]">
        {value}
      </p>
    </Card>
  );
}
