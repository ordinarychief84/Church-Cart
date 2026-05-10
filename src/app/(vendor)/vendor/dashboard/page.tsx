import Link from "next/link";
import {
  Boxes,
  ChurchIcon,
  Clock,
  ListOrdered,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Star,
  Truck,
  Wallet,
} from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardPanel, PanelEmpty, PanelList, PanelRow } from "@/components/dashboard/DashboardPanel";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Money } from "@/components/shared/Money";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { formatDate } from "@/lib/format";
import { logoutAction } from "@/app/actions/auth";

export default async function VendorDashboard() {
  const user = await requireRole("VENDOR");
  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });

  if (!vendor) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <DashboardHeader
          eyebrow="Vendor"
          title="Welcome to churchCart"
          subtitle="Set up your store profile to begin selling."
          right={
            <form action={logoutAction}>
              <button className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
            </form>
          }
        />
        <Card className="border-brand-200 bg-brand-50">
          <CardBody>
            <p className="text-sm text-brand-900">
              Before you can list products you need to fill out your store details. Approval typically takes
              under 24 hours.
            </p>
            <Link
              href="/vendor/settings"
              className="mt-3 inline-flex h-10 items-center rounded-md bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800"
            >
              Set up store →
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [
    productCount,
    activeOrderCount,
    actionableOrders,
    last7,
    prior7,
    lifetimeAgg,
    pendingPayoutAgg,
    recentOrders,
    topProducts,
    recentReviews,
  ] = await Promise.all([
    prisma.product.count({ where: { vendorId: vendor.id } }),
    prisma.order.count({
      where: {
        vendorId: vendor.id,
        status: { in: ["PAID", "PROCESSING", "SHIPPED", "ARRIVED_AT_CHURCH", "READY_FOR_PICKUP"] },
      },
    }),
    prisma.order.findMany({
      where: { vendorId: vendor.id, status: { in: ["PAID", "PROCESSING"] } },
      select: {
        id: true,
        status: true,
        totalKobo: true,
        vendorAmountKobo: true,
        createdAt: true,
        deliveryType: true,
        items: { select: { id: true, title: true, quantity: true } },
        churchBranch: { select: { churchName: true, branchName: true } },
        buyer: { select: { fullName: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.order.aggregate({
      where: {
        vendorId: vendor.id,
        status: { in: ["PICKED_UP", "DELIVERED", "COMPLETED"] },
        paidAt: { gte: sevenDaysAgo },
      },
      _sum: { vendorAmountKobo: true },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: {
        vendorId: vendor.id,
        status: { in: ["PICKED_UP", "DELIVERED", "COMPLETED"] },
        paidAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
      _sum: { vendorAmountKobo: true },
    }),
    prisma.order.aggregate({
      where: { vendorId: vendor.id, status: { in: ["PICKED_UP", "DELIVERED", "COMPLETED"] } },
      _sum: { vendorAmountKobo: true },
      _count: { _all: true },
    }),
    prisma.payout.aggregate({
      where: { vendorId: vendor.id, status: "PENDING" },
      _sum: { amountKobo: true },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      where: { vendorId: vendor.id, status: { not: "PENDING_PAYMENT" } },
      select: {
        id: true,
        status: true,
        vendorAmountKobo: true,
        createdAt: true,
        deliveryType: true,
        buyer: { select: { fullName: true } },
        churchBranch: { select: { branchName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { vendorId: vendor.id, status: { in: ["PAID", "PROCESSING", "SHIPPED", "ARRIVED_AT_CHURCH", "READY_FOR_PICKUP", "PICKED_UP", "DELIVERED", "COMPLETED"] } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.review.findMany({
      where: { product: { vendorId: vendor.id } },
      select: {
        id: true,
        rating: true,
        body: true,
        createdAt: true,
        author: { select: { fullName: true } },
        product: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const topProductDetails =
    topProducts.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: topProducts.map((t) => t.productId) } },
          select: { id: true, title: true, slug: true, priceKobo: true },
        })
      : [];
  const topProductMap = new Map(topProductDetails.map((p) => [p.id, p]));

  const sales7 = last7._sum.vendorAmountKobo ?? 0;
  const salesPrior7 = prior7._sum.vendorAmountKobo ?? 0;
  const delta =
    salesPrior7 === 0
      ? sales7 > 0
        ? { direction: "up" as const, label: "new" }
        : undefined
      : (() => {
          const pct = Math.round(((sales7 - salesPrior7) / salesPrior7) * 100);
          if (pct === 0) return { direction: "flat" as const, label: "0%" };
          return {
            direction: pct > 0 ? ("up" as const) : ("down" as const),
            label: `${pct > 0 ? "+" : ""}${pct}%`,
          };
        })();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <DashboardHeader
        eyebrow="Vendor"
        title={vendor.businessName}
        subtitle="Your store at a glance."
        right={
          <>
            {vendor.status === "PENDING" && <Badge tone="warning">Pending verification</Badge>}
            {vendor.status === "VERIFIED" && (
              <Badge tone="success">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck size={12} /> Verified
                </span>
              </Badge>
            )}
            {vendor.status === "REJECTED" && <Badge tone="danger">Rejected</Badge>}
            {vendor.status === "VERIFIED" && (
              <Link
                href="/vendor/products/new"
                className="inline-flex h-9 items-center gap-1 rounded-md bg-brand-700 px-3 text-sm font-medium text-white hover:bg-brand-800"
              >
                <Plus size={14} /> New product
              </Link>
            )}
            <form action={logoutAction}>
              <button className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
            </form>
          </>
        }
      />

      {vendor.status !== "VERIFIED" && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardBody className="flex items-start gap-3 text-amber-900">
            <ShieldAlert className="mt-0.5" />
            <div>
              <p className="font-semibold">
                {vendor.status === "PENDING"
                  ? "Your store is awaiting platform approval."
                  : "Your application was not approved."}
              </p>
              <p className="text-sm">
                {vendor.status === "PENDING"
                  ? "You will be able to list products once approved. Most stores are reviewed within 24 hours."
                  : vendor.rejectionReason || "Please update your store details and contact support."}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sales (7d)"
          value={<Money kobo={sales7} />}
          hint={`${last7._count._all} order${last7._count._all === 1 ? "" : "s"}`}
          icon={Wallet}
          tone="emerald"
          delta={delta}
        />
        <StatCard
          label="Active orders"
          value={activeOrderCount}
          hint="Paid · processing · shipped"
          icon={ListOrdered}
          tone="amber"
          href="/vendor/orders"
        />
        <StatCard
          label="Pending payouts"
          value={<Money kobo={pendingPayoutAgg._sum.amountKobo ?? 0} />}
          hint={`${pendingPayoutAgg._count._all} order${pendingPayoutAgg._count._all === 1 ? "" : "s"} clearing`}
          icon={Wallet}
          tone="gold"
        />
        <StatCard
          label="Products"
          value={productCount}
          hint="Live + hidden"
          icon={Boxes}
          tone="brand"
          href="/vendor/products"
        />
      </div>

      {/* Action queue */}
      {actionableOrders.length > 0 && (
        <section className="mt-8">
          <DashboardPanel
            title="Today's queue"
            subtitle="Orders waiting on you to process or ship"
            href="/vendor/orders"
          >
            <PanelList>
              {actionableOrders.map((o) => {
                const cta =
                  o.status === "PAID"
                    ? "Mark processing"
                    : o.status === "PROCESSING"
                    ? "Mark shipped"
                    : "Open";
                return (
                  <PanelRow key={o.id} href={`/vendor/orders`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                          o.status === "PAID" ? "bg-amber-50 text-amber-700" : "bg-brand-50 text-brand-700"
                        }`}
                      >
                        {o.status === "PAID" ? <Clock size={16} /> : <Truck size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {o.buyer.fullName} · #{o.id.slice(-6).toUpperCase()}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {o.items.length} item{o.items.length === 1 ? "" : "s"} ·{" "}
                          {o.deliveryType === "CHURCH_PICKUP"
                            ? `Church pickup · ${o.churchBranch?.branchName}`
                            : "Home delivery"}
                          {" "}· {formatDate(o.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <Money kobo={o.vendorAmountKobo} className="text-sm font-medium text-slate-900" />
                      <span className="text-xs font-medium text-brand-700">{cta} →</span>
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
            href="/vendor/orders"
          >
            {recentOrders.length === 0 ? (
              <PanelEmpty message="No orders yet — they will appear here as buyers check out." />
            ) : (
              <PanelList>
                {recentOrders.map((o) => (
                  <PanelRow key={o.id} href={`/vendor/orders`}>
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
                        <p className="truncate font-medium text-slate-900">
                          {o.buyer.fullName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          #{o.id.slice(-6).toUpperCase()} · {formatDate(o.createdAt)}
                          {o.churchBranch && ` · ${o.churchBranch.branchName}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Money kobo={o.vendorAmountKobo} className="text-sm font-medium" />
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </PanelRow>
                ))}
              </PanelList>
            )}
          </DashboardPanel>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-6">
          <DashboardPanel title="Top products" subtitle="By units sold" href="/vendor/products">
            {topProducts.length === 0 ? (
              <PanelEmpty message="Add products to see what's selling." />
            ) : (
              <PanelList>
                {topProducts.map((t) => {
                  const p = topProductMap.get(t.productId);
                  if (!p) return null;
                  return (
                    <PanelRow key={t.productId} href={`/products/${p.slug}`}>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{p.title}</p>
                        <p className="truncate text-xs text-slate-500">
                          <Money kobo={p.priceKobo} />
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        {t._sum.quantity ?? 0} sold
                      </span>
                    </PanelRow>
                  );
                })}
              </PanelList>
            )}
          </DashboardPanel>

          <DashboardPanel title="Recent reviews" subtitle="What buyers are saying">
            {recentReviews.length === 0 ? (
              <PanelEmpty message="No reviews yet." />
            ) : (
              <ul className="divide-y divide-slate-200">
                {recentReviews.map((r) => (
                  <li key={r.id} className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="truncate font-medium text-slate-900">{r.product.title}</p>
                      <span
                        className="inline-flex items-center gap-0.5 text-amber-500"
                        aria-label={`${r.rating} of 5 stars`}
                      >
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < r.rating ? "fill-amber-400" : "fill-transparent"}
                          />
                        ))}
                      </span>
                    </div>
                    {r.body && <p className="mt-1 line-clamp-2 text-xs text-slate-600">{r.body}</p>}
                    <p className="mt-1 text-xs text-slate-400">
                      {r.author.fullName} · {formatDate(r.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </DashboardPanel>

          <Card className="border-emerald-200 bg-emerald-50">
            <CardBody className="text-sm text-emerald-900">
              <p className="font-semibold">Lifetime sales</p>
              <p className="mt-1 text-xs">
                <Money kobo={lifetimeAgg._sum.vendorAmountKobo ?? 0} /> across {lifetimeAgg._count._all}{" "}
                completed order{lifetimeAgg._count._all === 1 ? "" : "s"}.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
