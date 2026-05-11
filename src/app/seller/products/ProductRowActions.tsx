"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Eye, EyeOff, Trash2, ExternalLink } from "lucide-react";
import { deleteProductAction, toggleProductAvailabilityAction } from "@/app/actions/seller";

const ICON_BTN =
  "grid h-8 w-8 place-items-center rounded text-[color:var(--cp-cocoa-mid)] hover:bg-[color:var(--cp-cream)] hover:text-[color:var(--cp-cocoa-deep)] transition-colors disabled:opacity-50";

export function ProductRowActions({
  productId,
  slug,
  available,
  hasPaystackUrl,
}: {
  productId: string;
  slug: string;
  available: boolean;
  hasPaystackUrl: boolean;
}) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex items-center gap-1">
      {available && hasPaystackUrl && (
        <Link
          href={`/p/${slug}`}
          target="_blank"
          className={ICON_BTN}
          aria-label="View public page"
          title="View public page"
        >
          <ExternalLink size={14} />
        </Link>
      )}
      <Link
        href={`/seller/products/${productId}/edit`}
        className={ICON_BTN}
        aria-label="Edit"
        title="Edit"
      >
        <Pencil size={14} />
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await toggleProductAvailabilityAction(productId);
            if ("error" in r && r.error) setError(r.error);
            else router.refresh();
          })
        }
        className={ICON_BTN}
        aria-label={available ? "Hide" : "Show"}
        title={available ? "Hide" : "Show"}
      >
        {available ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      {confirming ? (
        <span className="ml-1 inline-flex items-center gap-1 text-tag">
          <span className="text-[color:var(--cp-cocoa-mid)]">Delete?</span>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setError(null);
                const r = await deleteProductAction(productId);
                if ("error" in r && r.error) setError(r.error);
                else router.refresh();
                setConfirming(false);
              })
            }
            className="rounded px-2 py-0.5 font-medium text-white"
            style={{ background: "var(--cp-error)" }}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded border border-[color:var(--cp-rule)] bg-white px-2 py-0.5 text-[color:var(--cp-cocoa-mid)] hover:bg-[color:var(--cp-cream)]"
          >
            No
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="grid h-8 w-8 place-items-center rounded text-[color:var(--cp-cocoa-mid)] transition-colors hover:bg-[#FEEFE9] hover:text-[color:var(--cp-error)]"
          aria-label="Delete"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      )}
      {error && (
        <span className="ml-2 text-tag text-[color:var(--cp-error)]">{error}</span>
      )}
    </div>
  );
}
