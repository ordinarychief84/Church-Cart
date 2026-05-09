"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import {
  churchMarkArrivedAction,
  churchMarkReadyAction,
  churchFailedPickupAction,
} from "@/app/actions/orders";

export function ChurchOrderActions({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [showReason, setShowReason] = useState(false);
  const router = useRouter();

  const run = (fn: () => Promise<{ ok?: true; error?: string }>) =>
    start(async () => {
      setErr(null);
      const r = await fn();
      if ("error" in r && r.error) setErr(r.error);
      else router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {status === "SHIPPED" && (
          <Button size="sm" disabled={pending} onClick={() => run(() => churchMarkArrivedAction(orderId))}>
            Mark arrived
          </Button>
        )}
        {status === "ARRIVED_AT_CHURCH" && (
          <Button size="sm" disabled={pending} onClick={() => run(() => churchMarkReadyAction(orderId))}>
            Mark ready
          </Button>
        )}
        {(status === "ARRIVED_AT_CHURCH" || status === "READY_FOR_PICKUP") && (
          <Button
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={() => setShowReason((s) => !s)}
          >
            Failed pickup
          </Button>
        )}
      </div>
      {showReason && (
        <div className="flex items-center gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
          <Button
            variant="danger"
            size="sm"
            disabled={pending || !reason}
            onClick={() => run(() => churchFailedPickupAction(orderId, reason))}
          >
            Confirm
          </Button>
        </div>
      )}
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}
