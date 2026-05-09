"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { vendorMarkProcessingAction, vendorMarkShippedAction } from "@/app/actions/orders";

export function VendorOrderActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  if (status === "PAID") {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await vendorMarkProcessingAction(orderId);
              if ("error" in r) setErr(r.error!);
              else router.refresh();
            })
          }
        >
          Mark processing
        </Button>
        {err && <span className="text-xs text-red-600">{err}</span>}
      </div>
    );
  }

  if (status === "PROCESSING") {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await vendorMarkShippedAction(orderId);
              if ("error" in r) setErr(r.error!);
              else router.refresh();
            })
          }
        >
          Mark shipped
        </Button>
        {err && <span className="text-xs text-red-600">{err}</span>}
      </div>
    );
  }

  return <span className="text-xs text-slate-400">No action</span>;
}
