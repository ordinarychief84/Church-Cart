"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { submitReviewAction } from "@/app/actions/reviews";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId, productTitle }: { productId: string; productTitle: string }) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  if (done) return <p className="text-sm text-emerald-700">Thanks for reviewing {productTitle}.</p>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (rating < 1) return;
        const fd = new FormData();
        fd.set("productId", productId);
        fd.set("rating", String(rating));
        fd.set("body", body);
        start(async () => {
          const r = await submitReviewAction({}, fd);
          if ("error" in r && r.error) setErr(r.error);
          else {
            setDone(true);
            router.refresh();
          }
        });
      }}
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      <p className="font-medium">{productTitle}</p>
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className="text-amber-400"
            aria-label={`${n} stars`}
          >
            <Star size={20} className={cn(n <= rating ? "fill-amber-400" : "fill-transparent")} />
          </button>
        ))}
      </div>
      <Textarea
        rows={3}
        className="mt-2"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What did you like or what could be better?"
      />
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      <Button type="submit" size="sm" className="mt-2" disabled={pending || rating < 1}>
        {pending ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
