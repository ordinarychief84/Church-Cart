import {
  AlertTriangle,
  CheckCircle2,
  ChurchIcon,
  History,
  MapPin,
  Package,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardPanel, PanelEmpty, PanelList, PanelRow } from "@/components/dashboard/DashboardPanel";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { formatDate } from "@/lib/format";
import { logoutAction } from "@/app/actions/auth";

function startOfTodayLagos(): Date {
  // Compute "today 00:00 in Africa/Lagos" as a UTC Date the DB can compare.
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = fmt.format(new Date()).split("-").map(Number);
  // Lagos is UTC+1, no DST. Midnight Lagos = 23:00 UTC the prior day.
  return new Date(Date.UTC(y, m - 1, d, -1, 0, 0));
}

export default async function ChurchDashboard() {
  const user = await requireRole("CHURCH_ADMIN");
  const church = await prisma.churchBranch.findUnique({ where: { adminUserId: user.id } });

  if (!church) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <DashboardHeader
          eyebrow="Church admin"
          title="Welcome to churchCart"
          subtitle="Set up your branch profile to begin hosting pickups."
          right={
            <form action={logoutAction}>
              <button className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
            </form>
          }
        />
        <Card className="border-brand-200 bg-brand-50">
          <CardBody>
            <p className="text-sm text-brand-900">
              Tell us about your branch and a churchCart admin will review and approve. Buyers across Nigeria
              can then choose your branch as a pickup location.
            </p>
            <Link
              href="/church/settings"
              className="mt-3 inline-flex h-10 items-center rounded-md bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800"
            >
              Set up branch →
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  const todayStart = startOfTodayLagos();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    incomingCount,
    readyOrders,
    arrivedOrders,
    shippedOrders,
    pickupsToday,
    failedThisWeek,
    recentHistory,
    lifetimePickups,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        churchBranchId: church.id,
        status: { in: ["SHIPPED", "ARRIVED_AT_CHURCH", "READY_FOR_PICKUP"] },
      },
    }),
    prisma.order.findMany({
      where: { churchBranchId: church.id, status: "READY_FOR_PICKUP" },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        buyer: { select: { fullName: true } },
        vendor: { select: { businessName: true } },
        items: { select: { id: true } },
      },
      orderBy: { updatedAt: "asc" },
      take: 6,
    }),
    prisma.order.count({
      where: { churchBranchId: church.id, status: "ARRIVED_AT_CHURCH" },
    }),
    prisma.order.count({
      where: { churchBranchId: church.id, status: "SHIPPED" },
    }),
    prisma.order.count({
      where: {
        churchBranchId: church.id,
        status: "PICKED_UP",
        pickedUpAt: { gte: todayStart },
      },
    }),
    prisma.order.findMany({
      where: {
        churchBranchId: church.id,
        status: "FAILED_PICKUP",
        updatedAt: { gte: sevenDaysAgo },
      },
      select: {
        id: true,
        updatedAt: true,
        buyer: { select: { fullName: true } },
        vendor: { select: { businessName: true } },
        pickupRecord: { select: { failureReason: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.order.findMany({
      where: {
        churchBranchId: church.id,
        status: { in: ["PICKED_UP", "FAILED_PICKUP"] },
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        pickedUpAt: true,
        buyer: { select: { fullName: true } },
        vendor: { select: { businessName: true } },
        deliveryType: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.order.count({
      where: { churchBranchId: church.id, status: "PICKED_UP" },
    }),
  ]);

  const capacityUsed = incomingCount + arrivedOrders;
  const capacityPct = Math.min(100, Math.round((capacityUsed / Math.max(1, church.pickupCapacity)) * 100));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <DashboardHeader
        eyebrow="Church admin"
        title={`${church.churchName} — ${church.branchName}`}
        subtitle={
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} /> {church.address}, {church.city}, {church.state}
          </span>
        }
        right={
          <>
            {church.status === "PENDING" && <Badge tone="warning">Pending approval</Badge>}
            {church.status === "APPROVED" && (
              <Badge tone="success">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck size={12} /> Approved
                </span>
              </Badge>
            )}
            {church.status === "REJECTED" && <Badge tone="danger">Rejected</Badge>}
            {church.status === "APPROVED" && (
              <Link
                href="/church/verify"
                className="inline-flex h-9 items-center gap-1 rounded-md bg-brand-700 px-3 text-sm font-medium text-white hover:bg-brand-800"
              >
                <ScanLine size={14} /> Verify pickup
              </Link>
            )}
            <form action={logoutAction}>
              <button className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
            </form>
          </>
        }
      />

      {church.status !== "APPROVED" && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardBody className="flex items-start gap-3 text-amber-900">
            <ShieldAlert className="mt-0.5" />
            <div>
              <p className="font-semibold">
                {church.status === "PENDING"
                  ? "Your branch is awaiting approval."
                  : "Your branch is not approved."}
              </p>
              <p className="text-sm">
                {church.status === "PENDING"
                  ? "Buyers won't see your branch at checkout until a churchCart admin approves it."
                  : church.rejectionReason || "Update your branch details and contact support."}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Incoming packages"
          value={incomingCount}
          hint={`${shippedOrders} en route · ${arrivedOrders} arrived · ${readyOrders.length} ready`}
          icon={Package}
          tone="amber"
          href="/church/packages"
        />
        <StatCard
          label="Ready for pickup"
          value={readyOrders.length}
          hint="Buyer codes to verify"
          icon={ScanLine}
          tone="gold"
          href="/church/verify"
        />
        <StatCard
          label="Picked up today"
          value={pickupsToday}
          hint="Verified at this branch"
          icon={CheckCircle2}
          tone="emerald"
          href="/church/history"
        />
        <StatCard
          label="Lifetime pickups"
          value={lifetimePickups}
          hint="Total handed over"
          icon={History}
          tone="brand"
        />
      </div>

      {/* Capacity bar */}
      <Card className="mt-6">
        <CardBody>
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-slate-900">Branch capacity</p>
            <p className="text-xs text-slate-500">
              {capacityUsed} / {church.pickupCapacity} packages
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full ${
                capacityPct < 60
                  ? "bg-emerald-500"
                  : capacityPct < 85
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {capacityPct < 60
              ? "Plenty of room — branch is healthy."
              : capacityPct < 85
              ? "Branch is busy — consider clearing ready packages soon."
              : "Branch is at capacity — prioritise clearing ready pickups today."}
          </p>
        </CardBody>
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Ready for pickup queue */}
        <div className="lg:col-span-2">
          <DashboardPanel
            title="Ready for pickup"
            subtitle="Buyers can present their code now"
            href="/church/packages"
          >
            {readyOrders.length === 0 ? (
              <PanelEmpty message="No packages waiting on a buyer right now." />
            ) : (
              <PanelList>
                {readyOrders.map((o) => (
                  <PanelRow key={o.id} href="/church/verify">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-100 text-gold-800">
                        <ScanLine size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{o.buyer.fullName}</p>
                        <p className="truncate text-xs text-slate-500">
                          {o.vendor.businessName} · {o.items.length} item{o.items.length === 1 ? "" : "s"} · Marked ready{" "}
                          {formatDate(o.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-brand-700">Verify code →</span>
                  </PanelRow>
                ))}
              </PanelList>
            )}
          </DashboardPanel>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-6">
          <DashboardPanel
            title="Recent activity"
            subtitle="Last 6 pickups + failures"
            href="/church/history"
          >
            {recentHistory.length === 0 ? (
              <PanelEmpty message="No history yet." />
            ) : (
              <PanelList>
                {recentHistory.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <div
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                        o.status === "PICKED_UP"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {o.status === "PICKED_UP" ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <AlertTriangle size={12} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">
                        {o.buyer.fullName}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {o.vendor.businessName} ·{" "}
                        {o.pickedUpAt ? formatDate(o.pickedUpAt) : formatDate(o.updatedAt)}
                      </p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                  </li>
                ))}
              </PanelList>
            )}
          </DashboardPanel>

          {failedThisWeek.length > 0 && (
            <DashboardPanel title="Failed pickups (last 7 days)" subtitle="Reasons logged">
              <ul className="divide-y divide-slate-200">
                {failedThisWeek.map((o) => (
                  <li key={o.id} className="px-4 py-3 text-sm">
                    <p className="truncate font-medium text-slate-900">{o.buyer.fullName}</p>
                    <p className="text-xs text-slate-500">{o.vendor.businessName}</p>
                    {o.pickupRecord?.failureReason && (
                      <p className="mt-1 text-xs text-red-700">
                        Reason: {o.pickupRecord.failureReason}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </DashboardPanel>
          )}

          <Card className="border-brand-200 bg-brand-50">
            <CardBody className="text-sm text-brand-900">
              <div className="flex items-center gap-2 font-semibold">
                <ChurchIcon size={16} /> Branch contact
              </div>
              <p className="mt-1 text-xs">{church.contactPerson} · {church.contactPhone}</p>
              <p className="mt-1 text-xs">
                Open: {church.operatingDays} · {church.operatingHours}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
