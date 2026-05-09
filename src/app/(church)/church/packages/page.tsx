import { requireApprovedChurchAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { formatDate } from "@/lib/format";
import { ChurchOrderActions } from "./ChurchOrderActions";

export default async function ChurchPackagesPage() {
  const { church } = await requireApprovedChurchAdmin();
  const orders = await prisma.order.findMany({
    where: {
      churchBranchId: church.id,
      status: { in: ["SHIPPED", "ARRIVED_AT_CHURCH", "READY_FOR_PICKUP"] },
    },
    include: { buyer: true, items: true, vendor: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="Incoming packages" description={`${orders.length} active`} />
      {orders.length === 0 ? (
        <EmptyState
          title="No packages right now"
          description="Packages headed to your branch will appear here once vendors ship them."
        />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {orders.map((o) => (
            <li key={o.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <div>
                <p className="font-medium">
                  {o.vendor.businessName} → {o.buyer.fullName}
                </p>
                <p className="text-xs text-slate-500">
                  Order #{o.id.slice(-6).toUpperCase()} · {o.items.length} item · Updated{" "}
                  {formatDate(o.updatedAt)}
                </p>
                <p className="mt-1 text-xs">
                  Pickup code: <span className="font-mono">{o.pickupCode}</span>
                </p>
              </div>
              <OrderStatusBadge status={o.status} />
              <ChurchOrderActions orderId={o.id} status={o.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
