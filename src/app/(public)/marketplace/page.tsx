import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { CategoryChips } from "@/components/marketplace/CategoryChips";
import { EmptyState } from "@/components/shared/EmptyState";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: { q?: string; cat?: string };
}) {
  const { q, cat } = searchParams;

  const categories = await prisma.productCategory.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const products = await prisma.product.findMany({
    where: {
      available: true,
      vendor: { status: "VERIFIED" },
      ...(cat ? { category: { slug: cat } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { images: { orderBy: { position: "asc" } }, vendor: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Marketplace</h1>
        <form action="/marketplace" method="get" className="flex max-w-md gap-2">
          {cat && <input type="hidden" name="cat" value={cat} />}
          <input
            name="q"
            defaultValue={q || ""}
            placeholder="Search products"
            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800"
          >
            <Search size={16} /> Search
          </button>
        </form>
        <CategoryChips categories={categories} active={cat} />
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="No products yet"
          description={
            q || cat
              ? "Try a different search or category."
              : "Products will appear here once vendors are verified and listing items."
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
