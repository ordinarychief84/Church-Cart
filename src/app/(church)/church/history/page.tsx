import { requireApprovedChurchAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { formatDate } from "@/lib/format";

export default async function PickupHistoryPage() {
  const { church } = await requireApprovedChurchAdmin();
  const orders = await prisma.order.findMany({
    where: {
      churchBranchId: church.id,
      status: { in: ["PICKED_UP", "FAILED_PICKUP", "COMPLETED"] },
    },
    include: {
      buyer: { select: { id: true, fullName: true } },
      vendor: { select: { id: true, businessName: true } },
      pickupRecord: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="Pickup history" />
      {orders.length === 0 ? (
        <EmptyState title="No history yet" />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {orders.map((o) => (
            <li key={o.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-medium">
                  {o.vendor.businessName} → {o.buyer.fullName}
                </p>
                <p className="text-xs text-slate-500">
                  Order #{o.id.slice(-6).toUpperCase()} ·{" "}
                  {o.pickedUpAt
                    ? `Picked up ${formatDate(o.pickedUpAt)}`
                    : o.pickupRecord?.failedAt
                    ? `Failed ${formatDate(o.pickupRecord.failedAt)}`
                    : formatDate(o.updatedAt)}
                </p>
                {o.pickupRecord?.failureReason && (
                  <p className="text-xs text-red-600">Reason: {o.pickupRecord.failureReason}</p>
                )}
              </div>
              <OrderStatusBadge status={o.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
