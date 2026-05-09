"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/app/actions/cart";
import { Button } from "@/components/ui/Button";
import { ShoppingCart, Check } from "lucide-react";

export function AddToCartButton({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        disabled={disabled || pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await addToCartAction(productId, 1);
            if ("error" in res) {
              setError(res.error);
              return;
            }
            setDone(true);
            router.refresh();
            setTimeout(() => setDone(false), 1500);
          })
        }
      >
        {done ? <Check size={18} /> : <ShoppingCart size={18} />}
        {done ? "Added" : pending ? "Adding…" : "Add to cart"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
