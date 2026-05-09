import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import { ResolveDisputeForm } from "./ResolveDisputeForm";

export default async function AdminDisputesPage() {
  await requireAdmin();
  const disputes = await prisma.dispute.findMany({
    include: { order: { include: { buyer: true, vendor: true } }, openedBy: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="Disputes" description={`${disputes.length} total`} />
      {disputes.length === 0 ? (
        <p className="text-sm text-slate-500">No disputes opened yet.</p>
      ) : (
        <ul className="grid gap-4">
          {disputes.map((d) => (
            <li key={d.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">
                    Order #{d.order.id.slice(-6).toUpperCase()} — {d.order.buyer.fullName} vs {d.order.vendor.businessName}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(d.createdAt)}</p>
                  <p className="mt-2 text-sm font-medium">Reason: {d.reason}</p>
                  <p className="mt-1 text-sm text-slate-700">{d.description}</p>
                  {d.resolution && (
                    <p className="mt-2 text-sm text-emerald-700">Resolution: {d.resolution}</p>
                  )}
                </div>
                <Badge
                  tone={d.status === "OPEN" || d.status === "UNDER_REVIEW" ? "warning" : d.status === "RESOLVED" ? "success" : "neutral"}
                >
                  {d.status}
                </Badge>
              </div>
              {(d.status === "OPEN" || d.status === "UNDER_REVIEW") && (
                <ResolveDisputeForm disputeId={d.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
