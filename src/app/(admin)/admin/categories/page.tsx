import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { CategoryAdminPanel } from "./CategoryAdminPanel";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await prisma.productCategory.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="Categories" />
      <CategoryAdminPanel
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          active: c.active,
          productCount: c._count.products,
        }))}
      />
    </div>
  );
}
