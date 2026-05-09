"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { buyerCancelOrderAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/Button";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  return (
    <>
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await buyerCancelOrderAction(orderId);
            if ("error" in r) setErr(r.error!);
            else router.refresh();
          })
        }
      >
        {pending ? "Cancelling…" : "Cancel order"}
      </Button>
      {err && <span className="text-sm text-red-600">{err}</span>}
    </>
  );
}
