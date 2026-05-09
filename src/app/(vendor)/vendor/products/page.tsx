import Link from "next/link";
import { Plus, Boxes } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Money } from "@/components/shared/Money";

export default async function VendorProductsPage() {
  const user = await requireRole("VENDOR");
  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
  if (!vendor) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <PageHeader title="Products" />
        <EmptyState
          title="Set up your store first"
          description="You need to complete your store profile before adding products."
          action={
            <Link href="/vendor/settings" className="text-brand-700 hover:underline">
              Set up store →
            </Link>
          }
        />
      </div>
    );
  }
  const products = await prisma.product.findMany({
    where: { vendorId: vendor.id },
    include: { images: { orderBy: { position: "asc" }, take: 1 }, category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Products"
        description={`${products.length} listed`}
        action={
          vendor.status === "VERIFIED" && (
            <Link
              href="/vendor/products/new"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800"
            >
              <Plus size={16} /> New product
            </Link>
          )
        }
      />
      {vendor.status !== "VERIFIED" && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardBody className="text-sm text-amber-900">
            Your store is {vendor.status.toLowerCase()}. You will be able to list products once a platform
            admin verifies your account.
          </CardBody>
        </Card>
      )}
      {products.length === 0 ? (
        <EmptyState
          icon={<Boxes />}
          title="No products yet"
          description="Add your first product to start selling."
          action={
            vendor.status === "VERIFIED" && (
              <Link href="/vendor/products/new" className="text-brand-700 hover:underline">
                Add a product →
              </Link>
            )
          }
        />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 p-3">
              <div className="flex min-w-0 items-center gap-3">
                {p.images[0] ? (
                  <img src={p.images[0].url} alt="" className="h-12 w-12 rounded object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded bg-slate-100" />
                )}
                <div className="min-w-0">
                  <Link href={`/vendor/products/${p.id}/edit`} className="block truncate font-medium hover:underline">
                    {p.title}
                  </Link>
                  <p className="text-xs text-slate-500">{p.category.name}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Money kobo={p.priceKobo} className="text-sm font-medium" />
                <span className="text-xs text-slate-500">Stock: {p.inventoryQty}</span>
                <Badge tone={p.available ? "success" : "neutral"}>{p.available ? "Live" : "Hidden"}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
