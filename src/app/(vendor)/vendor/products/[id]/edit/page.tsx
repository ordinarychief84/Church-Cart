import { notFound } from "next/navigation";
import { requireVerifiedVendor } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProductForm } from "../../ProductForm";
import { ProductImageManager } from "./ProductImageManager";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const { vendor } = await requireVerifiedVendor();
  const product = await prisma.product.findFirst({
    where: { id: params.id, vendorId: vendor.id },
    include: { images: { orderBy: { position: "asc" } } },
  });
  if (!product) notFound();
  const categories = await prisma.productCategory.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="Edit product" description={product.title} />
      <div className="flex flex-col gap-6">
        <ProductImageManager
          productId={product.id}
          images={product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt ?? null }))}
        />
        <ProductForm categories={categories} mode="edit" product={product} />
      </div>
    </div>
  );
}
