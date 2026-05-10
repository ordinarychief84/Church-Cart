"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { adminOverrideStatusAction } from "@/app/actions/orders";

const STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "ARRIVED_AT_CHURCH",
  "READY_FOR_PICKUP",
  "PICKED_UP",
  "DELIVERED",
  "FAILED_PICKUP",
  "CANCELLED",
  "RETURNED",
  "DISPUTED",
  "COMPLETED",
];

export function OrderOverrideButton({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [next, setNext] = useState<OrderStatus>(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        Override…
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <Select
          value={next}
          onChange={(e) => setNext(e.target.value as OrderStatus)}
          className="h-8 px-2 py-0 text-xs"
          disabled={pending}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ").toLowerCase()}
            </option>
          ))}
        </Select>
        <Button
          size="sm"
          variant="danger"
          disabled={pending || next === currentStatus}
          onClick={() =>
            start(async () => {
              setError(null);
              const r = await adminOverrideStatusAction(orderId, next, "admin override");
              if ("error" in r && r.error) setError(r.error);
              else {
                setOpen(false);
                router.refresh();
              }
            })
          }
        >
          Apply
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
