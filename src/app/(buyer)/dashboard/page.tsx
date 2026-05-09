import Link from "next/link";
import { Package, ShoppingCart } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Money } from "@/components/shared/Money";
import { formatDate } from "@/lib/format";
import { logoutAction } from "@/app/actions/auth";
import { NOTIFICATION_TITLES, type NotificationType } from "@/lib/notifications";

export default async function BuyerDashboard() {
  const user = await requireRole("BUYER");
  const orders = await prisma.order.findMany({
    where: { buyerId: user.id },
    include: {
      items: true,
      vendor: { select: { id: true, businessName: true, slug: true } },
      churchBranch: { select: { id: true, churchName: true, branchName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: true },
  });
  const cartCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const recentNotifications = await prisma.notificationEvent.findMany({
    where: { recipientId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  const notifications = recentNotifications.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title={`Hello, ${user.fullName.split(" ")[0]}`}
        description="Track your orders, pickup codes and saved cart."
        action={
          <form action={logoutAction}>
            <button className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Cart items" value={cartCount} href="/cart" icon={<ShoppingCart />} />
        <Stat label="Active orders" value={orders.filter((o) => !["COMPLETED", "CANCELLED"].includes(o.status)).length} href="/orders" icon={<Package />} />
        <Stat label="New notifications" value={notifications} href="/dashboard" icon={<Package />} />
      </div>

      {recentNotifications.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Recent updates</h2>
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {recentNotifications.map((n) => (
              <li key={n.id} className="px-4 py-2 text-sm">
                <p className="font-medium">{NOTIFICATION_TITLES[n.type as NotificationType] ?? n.type}</p>
                <p className="text-xs text-slate-500">{formatDate(n.createdAt)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="mt-10 mb-3 text-lg font-semibold">Recent orders</h2>
      {orders.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">You have no orders yet.</p>
            <Link href="/marketplace" className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline">
              Browse marketplace →
            </Link>
          </CardBody>
        </Card>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {orders.map((o) => (
            <li key={o.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <Link href={`/orders/${o.id}`} className="font-medium hover:underline">
                  Order #{o.id.slice(-6).toUpperCase()}
                </Link>
                <p className="text-xs text-slate-500">
                  {o.vendor.businessName} · {formatDate(o.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Money kobo={o.totalKobo} className="font-medium" />
                <OrderStatusBadge status={o.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value: number;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="block">
      <Card className="hover:border-brand-400">
        <CardBody className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-50 text-brand-700">{icon}</div>
          <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
