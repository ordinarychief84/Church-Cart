import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ChurchRowActions } from "./ChurchRowActions";

export default async function AdminChurchesPage() {
  await requireAdmin();
  const churches = await prisma.churchBranch.findMany({
    include: { admin: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="Church branches" description={`${churches.length} total`} />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Branch</th>
              <th className="px-4 py-2">Admin</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {churches.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{c.churchName}</p>
                  <p className="text-xs text-slate-500">{c.branchName}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.admin.fullName}</td>
                <td className="px-4 py-3 text-slate-600">
                  {c.city}, {c.state}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={c.status === "APPROVED" ? "success" : c.status === "PENDING" ? "warning" : "danger"}>
                    {c.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <ChurchRowActions churchId={c.id} status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
