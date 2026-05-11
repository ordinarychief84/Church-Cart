"use client";

import { useTransition, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  markOrderArrivedAction,
  markOrderPickedUpAction,
  markOrderReadyAction,
} from "@/app/actions/church";
import { Button } from "@/components/ui";

type Variant = "ARRIVED" | "READY" | "PICKED_UP";

const COPY: Record<Variant, { label: string; busy: string }> = {
  ARRIVED: { label: "Mark arrived", busy: "Saving…" },
  READY: { label: "Mark ready for pickup", busy: "Saving…" },
  PICKED_UP: { label: "Confirm pickup", busy: "Saving…" },
};

export function ManifestActionButton({
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
    <div className="flex flex-col items-end gap-1 print:hidden">
      <Button
        type="button"
        size="sm"
        variant={variant === "PICKED_UP" ? "primary" : "secondary"}
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const action =
              variant === "ARRIVED"
                ? markOrderArrivedAction
                : variant === "READY"
                  ? markOrderReadyAction
                  : markOrderPickedUpAction;
            const res = await action(orderId);
            if ("error" in res && res.error) setError(res.error);
          });
        }}
        leadingIcon={pending ? <Loader2 size={12} className="animate-spin" /> : undefined}
      >
        {pending ? copy.busy : copy.label}
      </Button>
      {error && <p className="input-error">{error}</p>}
    </div>
  );
}
