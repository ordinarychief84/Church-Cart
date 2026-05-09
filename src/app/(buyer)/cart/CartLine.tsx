"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Minus, Plus } from "lucide-react";
import { updateCartItemAction, removeCartItemAction } from "@/app/actions/cart";
import { Money } from "@/components/shared/Money";

type Item = {
  id: string;
  quantity: number;
  priceKobo: number;
  product: {
    id: string;
    slug: string;
    title: string;
    inventoryQty: number;
    images: { url: string }[];
    vendor: { businessName: string };
  };
};

export function CartLine({ item }: { item: Item }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const update = (qty: number) =>
    startTransition(async () => {
      await updateCartItemAction(item.id, qty);
      router.refresh();
    });

  const remove = () =>
    startTransition(async () => {
      await removeCartItemAction(item.id);
      router.refresh();
    });

  const img = item.product.images[0]?.url;
  return (
    <li className="flex items-center gap-3 p-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-slate-100">
        {img && <Image src={img} alt="" fill className="object-cover" sizes="64px" />}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/products/${item.product.slug}`} className="block truncate font-medium hover:underline">
          {item.product.title}
        </Link>
        <p className="text-xs text-slate-500">{item.product.vendor.businessName}</p>
        <Money kobo={item.priceKobo} className="mt-1 block text-sm font-medium" />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => update(item.quantity - 1)}
          disabled={pending}
          className="grid h-8 w-8 place-items-center rounded border border-slate-300 hover:bg-slate-50"
          aria-label="Decrease quantity"
        >
          <Minus size={14} />
        </button>
        <span className="w-8 text-center text-sm">{item.quantity}</span>
        <button
          onClick={() => update(item.quantity + 1)}
          disabled={pending || item.quantity >= item.product.inventoryQty}
          className="grid h-8 w-8 place-items-center rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-40"
          aria-label="Increase quantity"
        >
          <Plus size={14} />
        </button>
      </div>
      <button
        onClick={remove}
        disabled={pending}
        className="ml-2 grid h-8 w-8 place-items-center rounded text-slate-500 hover:bg-red-50 hover:text-red-600"
        aria-label="Remove"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}
