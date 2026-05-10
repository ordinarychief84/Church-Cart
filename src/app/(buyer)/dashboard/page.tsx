import Link from "next/link";
import {
  Bell,
  ChurchIcon,
  ListOrdered,
  Package,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardPanel, PanelEmpty, PanelList, PanelRow } from "@/components/dashboard/DashboardPanel";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Money } from "@/components/shared/Money";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatNaira } from "@/lib/format";
import { logoutAction } from "@/app/actions/auth";
import { NOTIFICATION_TITLES, type NotificationType } from "@/lib/notifications";

const ACTION_REQUIRED_STATUSES = [
  "PENDING_PAYMENT",
  "READY_FOR_PICKUP",
  "FAILED_PICKUP",
  "DISPUTED",
] as const;

export default async function BuyerDashboard() {
  const user = await requireRole("BUYER");

  const [cart, orders, lifetimeAgg, notifications] = await Promise.all([
    prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: { select: { quantity: true, priceKobo: true } } },
    }),
    prisma.order.findMany({
      where: { buyerId: user.id },
      select: {
        id: true,
        status: true,
        totalKobo: true,
        createdAt: true,
        deliveryType: true,
        pickupCode: true,
        vendor: { select: { businessName: true, slug: true } },
        churchBranch: { select: { churchName: true, branchName: true } },
        payment: { select: { reference: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.aggregate({
      where: { buyerId: user.id, status: { in: ["PICKED_UP", "DELIVERED", "COMPLETED"] } },
      _sum: { totalKobo: true },
      _count: { _all: true },
    }),
    prisma.notificationEvent.findMany({
      where: { recipientId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const cartCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const cartSubtotal = cart?.items.reduce((s, i) => s + i.priceKobo * i.quantity, 0) ?? 0;
  const activeOrders = orders.filter(
    (o) => !["COMPLETED", "CANCELLED", "RETURNED"].includes(o.status)
  );
  const actionRequired = orders.filter((o) =>
    (ACTION_REQUIRED_STATUSES as readonly string[]).includes(o.status)
  );
  const recentOrders = orders.slice(0, 5);
  const lifetimeSpend = lifetimeAgg._sum.totalKobo ?? 0;
  const lifetimeCount = lifetimeAgg._count._all;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <DashboardHeader
        eyebrow="Buyer"
        title={`Welcome back, ${user.fullName.split(" ")[0]}`}
        subtitle="Track your orders, pickup codes and saved cart in one place."
        right={
          <form action={logoutAction}>
            <button className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
          </form>
        }
      />

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Cart"
          value={cartCount}
          hint={cartCount > 0 ? formatNaira(cartSubtotal) : "Empty"}
          icon={ShoppingCart}
          tone="brand"
          href="/cart"
        />
        <StatCard
          label="Active orders"
          value={activeOrders.length}
          hint={
            activeOrders.length > 0
              ? `${activeOrders.length} in progress`
              : "Nothing in flight"
          }
          icon={Package}
          tone="amber"
          href="/orders"
        />
        <StatCard
          label="Lifetime orders"
          value={lifetimeCount}
          hint={lifetimeCount === 0 ? "Your history will live here" : "Completed deliveries + pickups"}
          icon={ShoppingBag}
          tone="emerald"
          href="/orders"
        />
        <StatCard
          label="Total spent"
          value={<Money kobo={lifetimeSpend} />}
          hint={lifetimeCount > 0 ? `Across ${lifetimeCount} order${lifetimeCount === 1 ? "" : "s"}` : "—"}
          icon={Wallet}
          tone="gold"
        />
      </div>

      {/* Action required */}
      {actionRequired.length > 0 && (
        <section className="mt-8">
          <DashboardPanel
            title="Needs your attention"
            subtitle="Orders waiting on you to act"
            href="/orders"
          >
            <PanelList>
              {actionRequired.map((o) => {
                const tone =
                  o.status === "READY_FOR_PICKUP"
                    ? "gold"
                    : o.status === "PENDING_PAYMENT"
                    ? "warning"
                    : o.status === "FAILED_PICKUP" || o.status === "DISPUTED"
                    ? "danger"
                    : "info";
                const cta =
                  o.status === "PENDING_PAYMENT" && o.payment
                    ? { href: `/checkout/mock-payment?ref=${o.payment.reference}`, label: "Resume payment" }
                    : o.status === "READY_FOR_PICKUP"
                    ? { href: `/orders/${o.id}/pickup`, label: "Show pickup code" }
                    : { href: `/orders/${o.id}`, label: "Open order" };
                return (
                  <PanelRow key={o.id} href={cta.href}>
                    <div className="flex min-w-0 items-center gap-3">
                      <Badge tone={tone}>
                        {o.status === "READY_FOR_PICKUP"
                          ? "Ready for pickup"
                          : o.status.replace(/_/g, " ").toLowerCase()}
                      </Badge>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          Order #{o.id.slice(-6).toUpperCase()} · {o.vendor.businessName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {o.deliveryType === "CHURCH_PICKUP" && o.churchBranch
                            ? `Pickup at ${o.churchBranch.churchName} — ${o.churchBranch.branchName}`
                            : "Home delivery"}
                          {o.status === "READY_FOR_PICKUP" && o.pickupCode && (
                            <>
                              {" "}· Code <span className="font-mono">{o.pickupCode}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <Money kobo={o.totalKobo} className="text-sm font-medium" />
                      <span className="text-xs font-medium text-brand-700">{cta.label} →</span>
                    </div>
                  </PanelRow>
                );
              })}
            </PanelList>
          </DashboardPanel>
        </section>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="lg:col-span-2">
          <DashboardPanel
            title="Recent orders"
            subtitle={recentOrders.length > 0 ? `Last ${recentOrders.length}` : undefined}
            href="/orders"
          >
            {recentOrders.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <ShoppingBag className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-700">No orders yet</p>
                <p className="text-xs text-slate-500">When you buy something, it shows up here.</p>
                <Link
                  href="/marketplace"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                >
                  Browse marketplace →
                </Link>
              </div>
            ) : (
              <PanelList>
                {recentOrders.map((o) => (
                  <PanelRow key={o.id} href={`/orders/${o.id}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                          o.deliveryType === "CHURCH_PICKUP"
                            ? "bg-brand-50 text-brand-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {o.deliveryType === "CHURCH_PICKUP" ? <ChurchIcon size={16} /> : <Truck size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{o.vendor.businessName}</p>
                        <p className="truncate text-xs text-slate-500">
                          #{o.id.slice(-6).toUpperCase()} · {formatDate(o.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-right">
                      <Money kobo={o.totalKobo} className="text-sm font-medium" />
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </PanelRow>
                ))}
              </PanelList>
            )}
          </DashboardPanel>
        </div>

        {/* Right rail: notifications + quick links */}
        <div className="flex flex-col gap-6">
          <DashboardPanel title="Recent updates" subtitle="From your orders and account">
            {notifications.length === 0 ? (
              <PanelEmpty message="No updates yet." />
            ) : (
              <PanelList>
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                      <Bell size={12} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {NOTIFICATION_TITLES[n.type as NotificationType] ?? n.type}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(n.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </PanelList>
            )}
          </DashboardPanel>

          <DashboardPanel title="Quick actions" subtitle="Common things buyers do">
            <ul className="divide-y divide-slate-200">
              <QuickLink href="/marketplace" icon={<ShoppingBag size={14} />} label="Browse marketplace" />
              <QuickLink href="/cart" icon={<ShoppingCart size={14} />} label="Open cart" />
              <QuickLink href="/orders" icon={<ListOrdered size={14} />} label="All orders" />
              <QuickLink href="/church-pickup" icon={<ChurchIcon size={14} />} label="How church pickup works" />
            </ul>
          </DashboardPanel>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck size={16} /> Buyer protection
            </div>
            <p className="mt-1 text-xs leading-relaxed">
              You have 48 hours after delivery or pickup to report a problem. We mediate every dispute fairly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-100 text-slate-600">
          {icon}
        </span>
        <span className="flex-1">{label}</span>
        <span className="text-slate-400">→</span>
      </Link>
    </li>
  );
}
