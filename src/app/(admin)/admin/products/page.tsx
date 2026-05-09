import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Money } from "@/components/shared/Money";
import { Badge } from "@/components/ui/Badge";

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await prisma.product.findMany({
    include: { vendor: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="Products" description={`${products.length} most recent`} />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Vendor</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3 text-slate-600">{p.vendor.businessName}</td>
                <td className="px-4 py-3 text-slate-600">{p.category.name}</td>
                <td className="px-4 py-3"><Money kobo={p.priceKobo} /></td>
                <td className="px-4 py-3">{p.inventoryQty}</td>
                <td className="px-4 py-3">
                  <Badge tone={p.available ? "success" : "neutral"}>{p.available ? "Live" : "Hidden"}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
