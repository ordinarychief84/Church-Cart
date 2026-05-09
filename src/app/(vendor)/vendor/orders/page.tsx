import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Money } from "@/components/shared/Money";
import { formatDate } from "@/lib/format";
import { VendorOrderActions } from "./VendorOrderActions";

export default async function VendorOrdersPage() {
  const user = await requireRole("VENDOR");
  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
  if (!vendor) return null;
  const orders = await prisma.order.findMany({
    where: { vendorId: vendor.id, status: { not: "PENDING_PAYMENT" } },
    include: { items: true, buyer: true, churchBranch: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="Orders" description={`${orders.length} order${orders.length === 1 ? "" : "s"}`} />
      {orders.length === 0 ? (
        <EmptyState title="No paid orders yet" description="Once a buyer pays, the order shows up here." />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {orders.map((o) => (
            <li key={o.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <div>
                <p className="font-medium">
                  Order #{o.id.slice(-6).toUpperCase()} · {o.buyer.fullName}
                </p>
                <p className="text-xs text-slate-500">
                  {o.items.length} item · {formatDate(o.createdAt)} ·{" "}
                  {o.deliveryType === "CHURCH_PICKUP"
                    ? `Church pickup at ${o.churchBranch?.branchName}`
                    : "Home delivery"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Money kobo={o.vendorAmountKobo} />
                <OrderStatusBadge status={o.status} />
              </div>
              <VendorOrderActions orderId={o.id} status={o.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
