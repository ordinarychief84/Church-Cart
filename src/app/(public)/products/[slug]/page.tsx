import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ShieldCheck, ChurchIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Money } from "@/components/shared/Money";
import { Badge } from "@/components/ui/Badge";
import { AddToCartButton } from "@/components/marketplace/AddToCartButton";

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      images: { orderBy: { position: "asc" } },
      vendor: true,
      category: true,
      reviews: { include: { author: true }, orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!product || product.vendor.status !== "VERIFIED") notFound();

  const cover = product.images[0]?.url;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/marketplace" className="hover:underline">
          Marketplace
        </Link>{" "}
        / <span className="text-slate-700">{product.category.name}</span>
      </nav>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="grid grid-cols-4 gap-2">
          <div className="relative col-span-4 aspect-square overflow-hidden rounded-lg bg-slate-100">
            {cover && (
              <Image src={cover} alt={product.title} fill className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" />
            )}
          </div>
          {product.images.slice(1, 5).map((img) => (
            <div key={img.id} className="relative aspect-square overflow-hidden rounded bg-slate-100">
              <Image src={img.url} alt={img.alt || product.title} fill className="object-cover" sizes="100px" />
            </div>
          ))}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{product.title}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <Link href={`/vendors/${product.vendor.slug}`} className="font-medium hover:underline">
              {product.vendor.businessName}
            </Link>
            <ShieldCheck size={14} className="text-emerald-600" aria-label="Verified vendor" />
          </div>
          <Money kobo={product.priceKobo} className="mt-4 block text-3xl font-semibold" />
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="info">{product.category.name}</Badge>
            {product.isDigital && <Badge tone="gold">Digital</Badge>}
            <Badge tone={product.inventoryQty > 0 ? "success" : "danger"}>
              {product.inventoryQty > 0 ? `${product.inventoryQty} in stock` : "Sold out"}
            </Badge>
            <Badge tone="neutral" className="inline-flex items-center gap-1">
              <ChurchIcon size={12} /> Church pickup eligible
            </Badge>
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {product.description}
          </p>
          <div className="mt-6">
            <AddToCartButton productId={product.id} disabled={product.inventoryQty <= 0} />
          </div>
        </div>
      </div>

      {product.reviews.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold">Reviews</h2>
          <ul className="mt-3 space-y-3">
            {product.reviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{r.author.fullName}</p>
                  <span className="text-sm text-amber-600">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                </div>
                {r.body && <p className="mt-1 text-sm text-slate-600">{r.body}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
