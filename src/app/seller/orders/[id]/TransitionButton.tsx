"use client";

import { useTransition, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  markOrderProcessingAction,
  markOrderShippedAction,
} from "@/app/actions/seller";
import { Button } from "@/components/ui";

type Variant = "PROCESSING" | "SHIPPED";

const COPY: Record<Variant, { label: string; busy: string }> = {
  PROCESSING: { label: "Mark as processing", busy: "Updating…" },
  SHIPPED: { label: "Mark as shipped", busy: "Updating…" },
};

export function SellerTransitionButton({
  orderId,
  variant,
}: {
  orderId: string;
  variant: Variant;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[variant];

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const action =
              variant === "PROCESSING" ? markOrderProcessingAction : markOrderShippedAction;
            const res = await action(orderId);
            if ("error" in res && res.error) setError(res.error);
          });
        }}
        leadingIcon={pending ? <Loader2 size={14} className="animate-spin" /> : undefined}
      >
        {pending ? copy.busy : copy.label}
      </Button>
      {error && <p className="input-error">{error}</p>}
    </div>
  );
}
