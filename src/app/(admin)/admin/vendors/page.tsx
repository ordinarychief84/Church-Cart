import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { VendorRowActions } from "./VendorRowActions";

export default async function AdminVendorsPage() {
  await requireAdmin();
  const vendors = await prisma.vendorProfile.findMany({
    include: { user: true, _count: { select: { products: true, orders: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="Vendors" description={`${vendors.length} total`} />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Business</th>
              <th className="px-4 py-2">Owner</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Products</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {vendors.map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{v.businessName}</p>
                  <p className="text-xs text-slate-500">
                    {v.city}, {v.state}
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-600">{v.user.fullName}</td>
                <td className="px-4 py-3">
                  <Badge tone={v.status === "VERIFIED" ? "success" : v.status === "PENDING" ? "warning" : "danger"}>
                    {v.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">{v._count.products}</td>
                <td className="px-4 py-3">
                  <VendorRowActions vendorId={v.id} status={v.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
