import {
  ListOrdered,
  CheckCheck,
  Clock,
  Wallet,
  Store,
  ChurchIcon,
  AlertTriangle,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Money } from "@/components/shared/Money";
import { logoutAction } from "@/app/actions/auth";

export default async function AdminDashboard() {
  await requireAdmin();

  const [
    totalOrders,
    completedOrders,
    pendingOrders,
    gmvAgg,
    activeVendors,
    activePickup,
    totalPickups,
    failedPickups,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PICKED_UP", "DELIVERED", "COMPLETED"] } } }),
    prisma.order.count({ where: { status: { in: ["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED"] } } }),
    prisma.payment.aggregate({ _sum: { amountKobo: true }, where: { status: "SUCCEEDED" } }),
    prisma.vendorProfile.count({ where: { status: "VERIFIED" } }),
    prisma.churchBranch.count({ where: { status: "APPROVED" } }),
    prisma.order.count({
      where: { status: { in: ["PICKED_UP", "FAILED_PICKUP"] }, deliveryType: "CHURCH_PICKUP" },
    }),
    prisma.order.count({ where: { status: "FAILED_PICKUP" } }),
  ]);

  const failureRate = totalPickups > 0 ? Math.round((failedPickups / totalPickups) * 1000) / 10 : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Marketplace overview"
        description="High-level health of churchCart."
        action={
          <form action={logoutAction}>
            <button className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
          </form>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total orders" value={totalOrders} icon={<ListOrdered />} />
        <Stat label="Completed" value={completedOrders} icon={<CheckCheck />} />
        <Stat label="Pending" value={pendingOrders} icon={<Clock />} />
        <Stat label="Total GMV" value={<Money kobo={gmvAgg._sum.amountKobo ?? 0} />} icon={<Wallet />} />
        <Stat label="Active vendors" value={activeVendors} icon={<Store />} />
        <Stat label="Active pickup centers" value={activePickup} icon={<ChurchIcon />} />
        <Stat label="Failed pickups" value={failedPickups} icon={<AlertTriangle />} />
        <Stat label="Failed pickup rate" value={`${failureRate}%`} icon={<AlertTriangle />} />
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-50 text-brand-700">{icon}</div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}
