import Link from "next/link";
import {
  AlertTriangle,
  CheckCheck,
  ChurchIcon,
  Clock,
  ListOrdered,
  Store,
  Tags,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardPanel, PanelEmpty, PanelList, PanelRow } from "@/components/dashboard/DashboardPanel";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Money } from "@/components/shared/Money";
import { formatDate } from "@/lib/format";
import { logoutAction } from "@/app/actions/auth";

export default async function AdminDashboard() {
  await requireAdmin();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [
    totalOrders,
    completedOrders,
    pendingOrders,
    gmvAggLifetime,
    gmvLast7,
    gmvPrior7,
    activeVendors,
    pendingVendors,
    activePickup,
    pendingChurches,
    totalPickups,
    failedPickups,
    pendingDisputes,
    totalUsers,
    pendingVendorList,
    pendingChurchList,
    recentOrders,
    recentDisputes,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PICKED_UP", "DELIVERED", "COMPLETED"] } } }),
    prisma.order.count({
      where: { status: { in: ["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED"] } },
    }),
    prisma.payment.aggregate({ _sum: { amountKobo: true }, where: { status: "SUCCEEDED" } }),
    prisma.payment.aggregate({
      _sum: { amountKobo: true },
      _count: { _all: true },
      where: { status: "SUCCEEDED", verifiedAt: { gte: sevenDaysAgo } },
    }),
    prisma.payment.aggregate({
      _sum: { amountKobo: true },
      where: { status: "SUCCEEDED", verifiedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),
    prisma.vendorProfile.count({ where: { status: "VERIFIED" } }),
    prisma.vendorProfile.count({ where: { status: "PENDING" } }),
    prisma.churchBranch.count({ where: { status: "APPROVED" } }),
    prisma.churchBranch.count({ where: { status: "PENDING" } }),
    prisma.order.count({
      where: {
        status: { in: ["PICKED_UP", "FAILED_PICKUP"] },
        deliveryType: "CHURCH_PICKUP",
      },
    }),
    prisma.order.count({ where: { status: "FAILED_PICKUP" } }),
    prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
    prisma.user.count(),
    prisma.vendorProfile.findMany({
      where: { status: "PENDING" },
      select: {
        id: true,
        businessName: true,
        city: true,
        state: true,
        createdAt: true,
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.churchBranch.findMany({
      where: { status: "PENDING" },
      select: {
        id: true,
        churchName: true,
        branchName: true,
        city: true,
        state: true,
        createdAt: true,
        admin: { select: { fullName: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.order.findMany({
      select: {
        id: true,
        status: true,
        totalKobo: true,
        createdAt: true,
        deliveryType: true,
        buyer: { select: { fullName: true } },
        vendor: { select: { businessName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.dispute.findMany({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
        order: {
          select: {
            id: true,
            buyer: { select: { fullName: true } },
            vendor: { select: { businessName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const failureRate =
    totalPickups > 0 ? Math.round((failedPickups / totalPickups) * 1000) / 10 : 0;
  const gmv7 = gmvLast7._sum.amountKobo ?? 0;
  const gmvP7 = gmvPrior7._sum.amountKobo ?? 0;
  const gmvDelta =
    gmvP7 === 0
      ? gmv7 > 0
        ? { direction: "up" as const, label: "new" }
        : undefined
      : (() => {
          const pct = Math.round(((gmv7 - gmvP7) / gmvP7) * 100);
          return {
            direction: pct > 0 ? ("up" as const) : pct < 0 ? ("down" as const) : ("flat" as const),
            label: `${pct > 0 ? "+" : ""}${pct}%`,
          };
        })();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <DashboardHeader
        eyebrow="Platform admin"
        title="Marketplace overview"
        subtitle="Health of churchCart at a glance."
        right={
          <form action={logoutAction}>
            <button className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
          </form>
        }
      />

      {/* Top-line KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="GMV (7d)"
          value={<Money kobo={gmv7} />}
          hint={`${gmvLast7._count._all} payment${gmvLast7._count._all === 1 ? "" : "s"} · vs prior week`}
          icon={TrendingUp}
          tone="emerald"
          delta={gmvDelta}
        />
        <StatCard
          label="Lifetime GMV"
          value={<Money kobo={gmvAggLifetime._sum.amountKobo ?? 0} />}
          hint={`${completedOrders} completed of ${totalOrders} total`}
          icon={Wallet}
          tone="gold"
        />
        <StatCard
          label="Pending orders"
          value={pendingOrders}
          hint="Awaiting payment / shipping"
          icon={Clock}
          tone="amber"
          href="/admin/orders"
        />
        <StatCard
          label="Failed pickup rate"
          value={`${failureRate}%`}
          hint={`${failedPickups} failed of ${totalPickups} church pickups`}
          icon={AlertTriangle}
          tone={failureRate > 5 ? "red" : "slate"}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active vendors"
          value={activeVendors}
          hint={pendingVendors > 0 ? `${pendingVendors} awaiting review` : "Up to date"}
          icon={Store}
          tone={pendingVendors > 0 ? "amber" : "brand"}
          href="/admin/vendors"
        />
        <StatCard
          label="Active pickup centers"
          value={activePickup}
          hint={pendingChurches > 0 ? `${pendingChurches} awaiting review` : "Up to date"}
          icon={ChurchIcon}
          tone={pendingChurches > 0 ? "amber" : "brand"}
          href="/admin/churches"
        />
        <StatCard
          label="Open disputes"
          value={pendingDisputes}
          hint="Requires admin resolution"
          icon={AlertTriangle}
          tone={pendingDisputes > 0 ? "red" : "slate"}
          href="/admin/disputes"
        />
        <StatCard
          label="Total users"
          value={totalUsers}
          hint="Buyers + vendors + church admins + admins"
          icon={Users}
          tone="brand"
        />
      </div>

      {/* Approval queues */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardPanel
          title="Vendors awaiting review"
          subtitle={`${pendingVendors} pending`}
          href="/admin/vendors"
          hrefLabel="Open queue"
        >
          {pendingVendorList.length === 0 ? (
            <PanelEmpty message="No vendors waiting — nice." />
          ) : (
            <PanelList>
              {pendingVendorList.map((v) => (
                <PanelRow key={v.id} href="/admin/vendors">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700">
                      <Store size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{v.businessName}</p>
                      <p className="truncate text-xs text-slate-500">
                        {v.user.fullName} · {v.city}, {v.state} · Submitted {formatDate(v.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge tone="warning">Pending</Badge>
                </PanelRow>
              ))}
            </PanelList>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Church branches awaiting review"
          subtitle={`${pendingChurches} pending`}
          href="/admin/churches"
          hrefLabel="Open queue"
        >
          {pendingChurchList.length === 0 ? (
            <PanelEmpty message="No church branches waiting." />
          ) : (
            <PanelList>
              {pendingChurchList.map((c) => (
                <PanelRow key={c.id} href="/admin/churches">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700">
                      <ChurchIcon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {c.churchName} — {c.branchName}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {c.admin.fullName} · {c.city}, {c.state} · Submitted {formatDate(c.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge tone="warning">Pending</Badge>
                </PanelRow>
              ))}
            </PanelList>
          )}
        </DashboardPanel>
      </div>

      {/* Activity + disputes */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardPanel title="Recent orders" subtitle="Across all vendors" href="/admin/orders">
            {recentOrders.length === 0 ? (
              <PanelEmpty message="No orders yet." />
            ) : (
              <PanelList>
                {recentOrders.map((o) => (
                  <PanelRow key={o.id} href="/admin/orders">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                          o.deliveryType === "CHURCH_PICKUP"
                            ? "bg-brand-50 text-brand-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <ListOrdered size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {o.vendor.businessName} → {o.buyer.fullName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          #{o.id.slice(-6).toUpperCase()} · {formatDate(o.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Money kobo={o.totalKobo} className="text-sm font-medium" />
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </PanelRow>
                ))}
              </PanelList>
            )}
          </DashboardPanel>
        </div>

        <div className="flex flex-col gap-6">
          <DashboardPanel
            title="Open disputes"
            subtitle="Highest priority"
            href="/admin/disputes"
          >
            {recentDisputes.length === 0 ? (
              <PanelEmpty message="No open disputes." />
            ) : (
              <PanelList>
                {recentDisputes.map((d) => (
                  <PanelRow key={d.id} href="/admin/disputes">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{d.reason}</p>
                      <p className="truncate text-xs text-slate-500">
                        {d.order.buyer.fullName} vs {d.order.vendor.businessName} ·{" "}
                        {formatDate(d.createdAt)}
                      </p>
                    </div>
                    <Badge tone={d.status === "OPEN" ? "danger" : "warning"}>{d.status}</Badge>
                  </PanelRow>
                ))}
              </PanelList>
            )}
          </DashboardPanel>

          <DashboardPanel title="Quick actions" subtitle="Jump to admin tools">
            <ul className="divide-y divide-slate-200">
              <AdminQuickLink href="/admin/vendors" icon={<Store size={14} />} label="Vendors" />
              <AdminQuickLink
                href="/admin/churches"
                icon={<ChurchIcon size={14} />}
                label="Church branches"
              />
              <AdminQuickLink
                href="/admin/orders"
                icon={<ListOrdered size={14} />}
                label="All orders"
              />
              <AdminQuickLink
                href="/admin/disputes"
                icon={<AlertTriangle size={14} />}
                label="Disputes"
              />
              <AdminQuickLink href="/admin/categories" icon={<Tags size={14} />} label="Categories" />
            </ul>
          </DashboardPanel>

          <Card className="border-emerald-200 bg-emerald-50">
            <CardBody className="text-sm text-emerald-900">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCheck size={16} /> Health summary
              </div>
              <p className="mt-1 text-xs">
                {pendingVendors === 0 && pendingChurches === 0 && pendingDisputes === 0
                  ? "All queues clear. No action items waiting on the platform team."
                  : `${pendingVendors + pendingChurches} approval${
                      pendingVendors + pendingChurches === 1 ? "" : "s"
                    } and ${pendingDisputes} dispute${pendingDisputes === 1 ? "" : "s"} need attention.`}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AdminQuickLink({
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
