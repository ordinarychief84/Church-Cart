"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { setProductAvailabilityAction, deleteProductAction } from "@/app/actions/vendor";
import { Button } from "@/components/ui/Button";

export function ProductRowActions({
  productId,
  available,
}: {
  productId: string;
  available: boolean;
}) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const router = useRouter();

  const toggle = () =>
    start(async () => {
      setError(null);
      const r = await setProductAvailabilityAction(productId, !available);
      if ("error" in r && r.error) setError(r.error);
      else router.refresh();
    });

  const remove = () =>
    start(async () => {
      setError(null);
      setInfo(null);
      const r = await deleteProductAction(productId);
      if ("error" in r && r.error) {
        setError(r.error);
        return;
      }
      if ("softHidden" in r && r.softHidden) {
        setInfo(r.message ?? "Product hidden.");
        setConfirming(false);
        router.refresh();
        return;
      }
      setConfirming(false);
      router.refresh();
    });

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/vendor/products/${productId}/edit`}
        className="grid h-8 w-8 place-items-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        aria-label="Edit"
        title="Edit"
      >
        <Pencil size={14} />
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={toggle}
        className="grid h-8 w-8 place-items-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        aria-label={available ? "Hide from buyers" : "Show to buyers"}
        title={available ? "Hide from buyers" : "Show to buyers"}
      >
        {available ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      {confirming ? (
        <span className="ml-2 inline-flex items-center gap-1">
          <span className="text-xs text-slate-600">Delete?</span>
          <Button size="sm" variant="danger" disabled={pending} onClick={remove}>
            Yes
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
            No
          </Button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="grid h-8 w-8 place-items-center rounded text-slate-500 hover:bg-red-50 hover:text-red-600"
          aria-label="Delete"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      )}
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
      {info && <span className="ml-2 text-xs text-emerald-700">{info}</span>}
    </div>
  );
}
