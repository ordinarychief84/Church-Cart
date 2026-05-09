import { requireVerifiedVendor } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProductForm } from "../ProductForm";

export default async function NewProductPage() {
  await requireVerifiedVendor();
  const categories = await prisma.productCategory.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="New product" description="List a new product on churchCart." />
      <ProductForm categories={categories} mode="create" />
    </div>
  );
}
