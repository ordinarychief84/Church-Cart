import { Wallet } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Money } from "@/components/shared/Money";
import { formatDate } from "@/lib/format";

const STATUS_TONE = {
  PENDING: "warning",
  ELIGIBLE: "info",
  PAID: "success",
  FAILED: "danger",
} as const;

export default async function VendorPayoutsPage() {
  const user = await requireRole("VENDOR");
  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
  if (!vendor) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <PageHeader title="Payouts" />
        <EmptyState title="Set up your store first" description="Payouts appear after your first sale." />
      </div>
    );
  }

  const [payouts, agg] = await Promise.all([
    prisma.payout.findMany({
      where: { vendorId: vendor.id },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            deliveryType: true,
            buyer: { select: { fullName: true } },
            churchBranch: { select: { branchName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.payout.groupBy({
      by: ["status"],
      where: { vendorId: vendor.id },
      _sum: { amountKobo: true },
      _count: { _all: true },
    }),
  ]);

  const totals = Object.fromEntries(agg.map((row) => [row.status, row]));
  const pendingTotal = totals["PENDING"]?._sum.amountKobo ?? 0;
  const eligibleTotal = totals["ELIGIBLE"]?._sum.amountKobo ?? 0;
  const paidTotal = totals["PAID"]?._sum.amountKobo ?? 0;

  const now = new Date();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="Payouts" description="Settlements after the dispute window closes." />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pending</p>
            <Money kobo={pendingTotal} className="mt-1 block text-2xl font-semibold text-slate-900" />
            <p className="mt-1 text-xs text-slate-500">Within the dispute window</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Eligible</p>
            <Money kobo={eligibleTotal} className="mt-1 block text-2xl font-semibold text-slate-900" />
            <p className="mt-1 text-xs text-slate-500">Cleared, awaiting transfer</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Paid lifetime</p>
            <Money kobo={paidTotal} className="mt-1 block text-2xl font-semibold text-slate-900" />
            <p className="mt-1 text-xs text-slate-500">Settled to your account</p>
          </CardBody>
        </Card>
      </div>

      {payouts.length === 0 ? (
        <EmptyState
          icon={<Wallet />}
          title="No payouts yet"
          description="Payouts are created automatically when an order is picked up or delivered."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Buyer</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Eligible at</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payouts.map((p) => {
                const eligibleSoon =
                  p.status === "PENDING" && p.eligibleAt && p.eligibleAt <= now;
                const tone = eligibleSoon ? "info" : STATUS_TONE[p.status];
                const label = eligibleSoon ? "Eligible (pending payout)" : p.status;
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono text-xs">
                      #{p.orderId.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      {p.order.buyer.fullName}
                      <span className="block text-xs text-slate-500">
                        {p.order.deliveryType === "CHURCH_PICKUP" && p.order.churchBranch
                          ? p.order.churchBranch.branchName
                          : "Home delivery"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Money kobo={p.amountKobo} className="font-medium" />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {p.eligibleAt ? formatDate(p.eligibleAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={tone}>{label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs text-slate-500">
        Payouts become eligible 48 hours after pickup or delivery to allow buyers to open disputes. Real
        bank transfers will start once Paystack payouts are wired up.
      </p>
    </div>
  );
}
