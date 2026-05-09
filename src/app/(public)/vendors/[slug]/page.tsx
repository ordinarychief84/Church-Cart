import { notFound } from "next/navigation";
import { ShieldCheck, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function VendorPage({ params }: { params: { slug: string } }) {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { slug: params.slug },
    include: {
      products: {
        where: { available: true },
        include: { images: { orderBy: { position: "asc" } }, vendor: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!vendor || vendor.status !== "VERIFIED") notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{vendor.businessName}</h1>
          <ShieldCheck size={18} className="text-emerald-600" />
        </div>
        <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-600">
          <MapPin size={14} /> {vendor.city}, {vendor.state}
        </p>
        {vendor.churchAffiliation && (
          <p className="mt-1 text-sm text-slate-500">Church affiliation: {vendor.churchAffiliation}</p>
        )}
        {vendor.description && <p className="mt-4 text-sm leading-relaxed text-slate-700">{vendor.description}</p>}
      </div>

      {vendor.products.length === 0 ? (
        <EmptyState title="No products listed yet" />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {vendor.products.map((p) => (
            <ProductCard key={p.id} product={{ ...p, vendor }} />
          ))}
        </div>
      )}
    </div>
  );
}
