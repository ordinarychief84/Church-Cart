import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { Money } from "@/components/shared/Money";

type Props = {
  product: {
    id: string;
    slug: string;
    title: string;
    priceKobo: number;
    images: { url: string }[];
    vendor: { businessName: string; slug: string; status: string };
  };
};

export function ProductCard({ product }: Props) {
  const img = product.images[0]?.url;
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full bg-slate-100">
        {img ? (
          <Image src={img} alt={product.title} fill className="object-cover" sizes="(max-width:768px) 50vw, 25vw" />
        ) : (
          <div className="grid h-full place-items-center text-xs text-slate-400">No image</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-slate-900 group-hover:text-brand-800">
          {product.title}
        </p>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span>{product.vendor.businessName}</span>
          {product.vendor.status === "VERIFIED" && (
            <ShieldCheck size={12} className="text-emerald-600" aria-label="Verified vendor" />
          )}
        </div>
        <Money kobo={product.priceKobo} className="mt-1 text-base font-semibold text-slate-900" />
      </div>
    </Link>
  );
}
