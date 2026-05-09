import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Money } from "@/components/shared/Money";
import { formatDate } from "@/lib/format";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await prisma.order.findMany({
    include: {
      vendor: { select: { id: true, businessName: true } },
      buyer: { select: { id: true, fullName: true, email: true } },
      churchBranch: { select: { id: true, churchName: true, branchName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="Orders" description={`${orders.length} most recent`} />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Order</th>
              <th className="px-4 py-2">Buyer</th>
              <th className="px-4 py-2">Vendor</th>
              <th className="px-4 py-2">Delivery</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-mono text-xs">#{o.id.slice(-6).toUpperCase()}</td>
                <td className="px-4 py-3">{o.buyer.fullName}</td>
                <td className="px-4 py-3">{o.vendor.businessName}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {o.deliveryType === "CHURCH_PICKUP"
                    ? `${o.churchBranch?.churchName} — ${o.churchBranch?.branchName}`
                    : "Home"}
                </td>
                <td className="px-4 py-3"><Money kobo={o.totalKobo} /></td>
                <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
