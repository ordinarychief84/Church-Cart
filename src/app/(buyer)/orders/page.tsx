import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Money } from "@/components/shared/Money";
import { formatDate } from "@/lib/format";

export default async function BuyerOrdersPage() {
  const user = await requireRole("BUYER");
  const orders = await prisma.order.findMany({
    where: { buyerId: user.id },
    include: {
      vendor: { select: { id: true, businessName: true, slug: true, status: true } },
      items: true,
      churchBranch: {
        select: { id: true, churchName: true, branchName: true, city: true, state: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader title="Your orders" />
      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you buy something it will show up here."
          action={
            <Link href="/marketplace" className="text-brand-700 hover:underline">
              Browse marketplace →
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {orders.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link href={`/orders/${o.id}`} className="font-medium hover:underline">
                  Order #{o.id.slice(-6).toUpperCase()}
                </Link>
                <p className="text-xs text-slate-500">
                  {o.vendor.businessName} · {o.items.length} item{o.items.length === 1 ? "" : "s"} ·{" "}
                  {formatDate(o.createdAt)}
                </p>
                {o.churchBranch && (
                  <p className="text-xs text-slate-500">
                    Pickup at {o.churchBranch.churchName} — {o.churchBranch.branchName}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
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
