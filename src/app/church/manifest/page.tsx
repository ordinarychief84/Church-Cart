import Link from "next/link";
import { ArrowLeft, ChurchIcon, MapPin, Package } from "lucide-react";
import { requireRole } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { formatDate, formatNaira } from "@/lib/format";
import { DENOMINATION_LABELS } from "@/lib/validation";
import type {
  ChurchBranch,
  Order,
  OrderItem,
  OrderStatus,
  Profile,
} from "@/lib/supabase/types";
import { ManifestActionButton } from "./ManifestActions";
import { PrintBtn } from "./PrintBtn";

export const dynamic = "force-dynamic";

type ManifestOrder = Pick<
  Order,
  "id" | "status" | "total_kobo" | "created_at" | "paid_at" | "pickup_code"
> & {
  buyer: Pick<Profile, "full_name" | "phone"> | null;
  items: Pick<OrderItem, "title" | "quantity">[];
};

const GROUPS: { key: OrderStatus; title: string; help: string }[] = [
  {
    key: "SHIPPED",
    title: "On the way",
    help: "Seller has shipped these to the church. Mark each one when it physically arrives.",
  },
  {
    key: "ARRIVED_AT_CHURCH",
    title: "Arrived — preparing for pickup",
    help: "Confirm the package is in the pickup area, then mark it ready for the member.",
  },
  {
    key: "READY_FOR_PICKUP",
    title: "Ready for pickup today",
    help: "The member can collect these now. Confirm pickup when they do.",
  },
];

export default async function ChurchManifest() {
  const user = await requireRole("CHURCH_ADMIN");
  const supabase = createSupabaseServerClient();

  const { data: branch } = await supabase
    .from("church_branches")
    .select("id, denomination, branch_name, address, city, state, operating_days, operating_hours")
    .eq("admin_user_id", user.id)
    .maybeSingle<
      Pick<
        ChurchBranch,
        | "id"
        | "denomination"
        | "branch_name"
        | "address"
        | "city"
        | "state"
        | "operating_days"
        | "operating_hours"
      >
    >();

  if (!branch) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/church"
          className="inline-flex items-center gap-1 text-body-sm text-[color:var(--cp-cocoa-mid)] hover:text-[color:var(--cp-gold)]"
        >
          <ArrowLeft size={14} /> Back
        </Link>
        <p className="mt-3 text-body-sm text-[color:var(--cp-cocoa-mid)]">
          Register your branch first.
        </p>
      </main>
    );
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `id, status, total_kobo, created_at, paid_at, pickup_code,
       buyer:profiles ( full_name, phone ),
       items:order_items ( title, quantity )`
    )
    .eq("church_branch_id", branch.id)
    .in("status", ["SHIPPED", "ARRIVED_AT_CHURCH", "READY_FOR_PICKUP"] as unknown as string[])
    .order("created_at", { ascending: true })
    .returns<ManifestOrder[]>();

  const all = orders ?? [];
  const today = new Date();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 print:px-0 print:py-2">
      <div className="flex items-start justify-between gap-3 print:hidden">
        <Link
          href="/church"
          className="inline-flex items-center gap-1 text-body-sm text-[color:var(--cp-cocoa-mid)] hover:text-[color:var(--cp-gold)]"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
        <PrintBtn />
      </div>

      <header className="mt-3 border-b border-[color:var(--cp-rule)] pb-4">
        <p className="text-label text-[color:var(--cp-cocoa-mid)]">Daily pickup manifest</p>
        <h1 className="text-h1 mt-1 inline-flex items-center gap-2 text-[color:var(--cp-cocoa-deep)]">
          <ChurchIcon size={22} className="text-[color:var(--cp-gold)]" />
          {DENOMINATION_LABELS[branch.denomination]} — {branch.branch_name}
        </h1>
        <p className="mt-1 inline-flex items-center gap-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">
          <MapPin size={12} /> {branch.address}, {branch.city}, {branch.state}
        </p>
        <p className="text-mono text-[color:var(--cp-mid)]">
          Generated {today.toLocaleString("en-NG", { dateStyle: "full", timeStyle: "short" })} ·
          Pickup hours {branch.operating_hours}
        </p>
      </header>

      {all.length === 0 && (
        <Card className="mt-6 text-center">
          <Package className="mx-auto h-7 w-7 text-[color:var(--cp-sand-dark)]" />
          <p className="mt-2 font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
            No packages to track right now
          </p>
          <p className="text-body-sm text-[color:var(--cp-cocoa-mid)]">
            Anything sellers ship to your branch will appear here.
          </p>
        </Card>
      )}

      {GROUPS.map((group) => {
        const rows = all.filter((o) => o.status === group.key);
        if (rows.length === 0) return null;
        return (
          <section key={group.key} className="mt-6">
            <h2 className="text-h2 text-[color:var(--cp-cocoa-deep)]">
              {group.title}{" "}
              <span className="font-editorial font-normal text-[color:var(--cp-mid)]">
                · {rows.length}
              </span>
            </h2>
            <p className="text-body-sm text-[color:var(--cp-cocoa-mid)]">{group.help}</p>
            <ul className="mt-3 divide-y divide-[color:var(--cp-rule)] overflow-hidden rounded-xl border border-[color:var(--cp-rule)] bg-white">
              {rows.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
                      {o.buyer?.full_name ?? "Member"} ·{" "}
                      <span className="text-mono text-[color:var(--cp-cocoa-mid)]">
                        #{o.id.slice(-6).toUpperCase()}
                      </span>
                    </p>
                    <p className="truncate text-tag text-[color:var(--cp-cocoa-mid)]">
                      {o.items.length > 0
                        ? o.items.map((i) => `${i.title} × ${i.quantity}`).join(", ")
                        : "Order details"}
                    </p>
                    <p className="mt-0.5 text-mono text-[color:var(--cp-mid)]">
                      Placed {formatDate(o.created_at)} · Total {formatNaira(o.total_kobo)}
                      {o.buyer?.phone ? ` · ${o.buyer.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {group.key === "SHIPPED" && (
                      <ManifestActionButton orderId={o.id} variant="ARRIVED" />
                    )}
                    {group.key === "ARRIVED_AT_CHURCH" && (
                      <ManifestActionButton orderId={o.id} variant="READY" />
                    )}
                    {group.key === "READY_FOR_PICKUP" && (
                      <ManifestActionButton orderId={o.id} variant="PICKED_UP" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <footer className="mt-8 border-t border-[color:var(--cp-rule)] pt-4 text-mono text-[color:var(--cp-mid)]">
        Church Potal pickup manifest · {branch.branch_name}
      </footer>
    </main>
  );
}
