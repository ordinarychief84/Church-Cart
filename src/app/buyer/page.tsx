import Link from "next/link";
import { ChurchIcon, MapPin, Package, ShoppingBag } from "lucide-react";
import { requireRole } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, LinkButton, OrderStatusPill } from "@/components/ui";
import { HomeChurchPicker } from "./HomeChurchPicker";
import { formatDate, formatNaira } from "@/lib/format";
import { DENOMINATION_LABELS } from "@/lib/validation";
import type { ChurchBranch, Order } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type OrderRow = Pick<Order, "id" | "status" | "total_kobo" | "created_at"> & {
  branch: Pick<ChurchBranch, "denomination" | "branch_name"> | null;
};

export default async function BuyerHome({
  searchParams,
}: {
  searchParams: { placed?: string; error?: string };
}) {
  const user = await requireRole("BUYER");
  const supabase = createSupabaseServerClient();

  const [branchesResp, homeBranchResp, ordersResp] = await Promise.all([
    supabase
      .from("church_branches")
      .select("id, denomination, branch_name, city, state")
      .eq("status", "APPROVED")
      .order("denomination")
      .returns<
        Pick<ChurchBranch, "id" | "denomination" | "branch_name" | "city" | "state">[]
      >(),
    user.profile.home_church_branch_id
      ? supabase
          .from("church_branches")
          .select("id, denomination, branch_name, city, state, operating_days, operating_hours")
          .eq("id", user.profile.home_church_branch_id)
          .maybeSingle<
            Pick<
              ChurchBranch,
              | "id"
              | "denomination"
              | "branch_name"
              | "city"
              | "state"
              | "operating_days"
              | "operating_hours"
            >
          >()
      : Promise.resolve({ data: null }),
    supabase
      .from("orders")
      .select(
        `id, status, total_kobo, created_at,
         branch:church_branches ( denomination, branch_name )`
      )
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<OrderRow[]>(),
  ]);

  const branches = branchesResp.data ?? [];
  const homeBranch = homeBranchResp.data;
  const orders = ordersResp.data ?? [];

  return (
    <DashboardShell
      badge="Member"
      icon={ShoppingBag}
      title={`Welcome, ${user.profile.full_name.split(" ")[0]}`}
      subtitle="Shop with believers across Nigeria. Pick up at your home church."
    >
      {searchParams.placed && (
        <div className="mb-4 rounded-lg border border-[color:var(--cp-success)]/30 bg-[color:var(--cp-success)]/10 p-3 text-body-sm text-[color:var(--cp-success)]">
          Order placed. Your seller has been notified — pay to confirm.
        </div>
      )}
      {searchParams.error && <ErrorBanner code={searchParams.error} />}

      {/* Home church */}
      <Card>
        <div className="flex items-center gap-2">
          <ChurchIcon size={16} className="text-[color:var(--cp-gold)]" />
          <h2 className="text-h3 text-[color:var(--cp-cocoa-deep)]">Your home church</h2>
        </div>
        <p className="mt-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">
          When you place an order, it'll be delivered to your home church branch for pickup.
        </p>

        {homeBranch ? (
          <div
            className="mt-4 rounded-lg border p-4 text-body-sm"
            style={{
              borderColor: "rgba(45,122,79,0.3)",
              background: "rgba(45,122,79,0.08)",
              color: "var(--cp-cocoa-deep)",
            }}
          >
            <p className="font-editorial text-base font-bold">
              {DENOMINATION_LABELS[homeBranch.denomination]} — {homeBranch.branch_name}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-tag text-[color:var(--cp-cocoa-mid)]">
              <MapPin size={11} /> {homeBranch.city}, {homeBranch.state}
            </p>
            <p className="mt-1 text-mono">
              Pickup days: {homeBranch.operating_days} · {homeBranch.operating_hours}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-body-sm text-[color:var(--cp-cocoa-mid)]">
            You haven't picked a home church yet. Pick one below — you can change it any time.
          </p>
        )}

        <div className="mt-4">
          <HomeChurchPicker
            branches={branches}
            initialBranchId={user.profile.home_church_branch_id}
          />
        </div>
      </Card>

      {/* Quick actions */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <DashCard
          title="Browse marketplace"
          body="Physical goods from verified Christian sellers, with church pickup."
          href="/marketplace"
          cta="Open marketplace →"
        />
        <DashCard
          title="Your orders"
          body="Track every order from placement to pickup."
          href="#orders"
          cta={`${orders.length} recent`}
        />
      </section>

      {/* Orders */}
      <section id="orders" className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-h2 text-[color:var(--cp-cocoa-deep)]">Recent orders</h2>
        </div>

        {orders.length === 0 ? (
          <Card className="text-center">
            <Package className="mx-auto h-7 w-7 text-[color:var(--cp-sand-dark)]" />
            <p className="mt-2 font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
              No orders yet
            </p>
            <p className="text-body-sm text-[color:var(--cp-cocoa-mid)]">
              When you buy something it'll show up here.
            </p>
            <LinkButton href="/marketplace" size="sm" className="mt-4">
              Browse marketplace
            </LinkButton>
          </Card>
        ) : (
          <ul className="divide-y divide-[color:var(--cp-rule)] overflow-hidden rounded-xl border border-[color:var(--cp-rule)] bg-white">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/buyer/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-body-sm hover:bg-[color:var(--cp-cream)]"
                >
                  <div className="min-w-0">
                    <p className="font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
                      Order <span className="text-mono">#{o.id.slice(-6).toUpperCase()}</span>
                    </p>
                    <p className="truncate text-tag text-[color:var(--cp-cocoa-mid)]">
                      {o.branch
                        ? `Pickup at ${DENOMINATION_LABELS[o.branch.denomination]} — ${o.branch.branch_name}`
                        : "Home delivery"}
                      {" · "}
                      {formatDate(o.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
                      {formatNaira(o.total_kobo)}
                    </span>
                    <OrderStatusPill status={o.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardShell>
  );
}

const ERROR_COPY: Record<string, string> = {
  "invalid-order": "Couldn't place that order — please try again from the product page.",
  "product-unavailable": "That product is no longer available.",
  "digital-not-pickup": "Digital products don't use church pickup.",
  "out-of-stock": "That product is out of stock.",
  "branch-not-supported": "Your home church isn't a pickup location for that product.",
  "could-not-place": "Could not place that order. Please try again.",
  "order-line-failed": "Order created but item line failed — please contact support.",
};

function ErrorBanner({ code }: { code: string }) {
  const msg = ERROR_COPY[code] ?? "Something went wrong.";
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border p-3 text-body-sm"
      style={{ background: "#FEEFE9", borderColor: "#F4B7A8", color: "#842029" }}
    >
      {msg}
    </div>
  );
}

function DashCard({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="card card-interactive block transition-colors"
    >
      <p className="font-editorial text-lg font-bold text-[color:var(--cp-cocoa-deep)]">{title}</p>
      <p className="mt-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">{body}</p>
      <p className="mt-3 text-tag text-[color:var(--cp-gold)]">{cta}</p>
    </Link>
  );
}
