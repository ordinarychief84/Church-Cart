"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { openDisputeAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";

export function OpenDisputeButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  if (!open) {
    return (
      <Button variant="danger" onClick={() => setOpen(true)}>
        Report a problem
      </Button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="font-semibold text-red-900">Open a dispute</p>
      <p className="text-sm text-red-800">
        Tell us what went wrong. An admin will review within 48 hours.
      </p>
      <div className="mt-3 grid gap-3">
        <div>
          <Label htmlFor="reason">Reason</Label>
          <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. wrong item" />
        </div>
        <div>
          <Label htmlFor="description">Details</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>
        {err && <p className="text-sm text-red-700">{err}</p>}
        <div className="flex gap-2">
          <Button
            variant="danger"
            disabled={pending || !reason || !description}
            onClick={() =>
              start(async () => {
                setErr(null);
                const r = await openDisputeAction(orderId, reason, description);
                if ("error" in r) setErr(r.error!);
                else {
                  setOpen(false);
                  router.refresh();
                }
              })
            }
          >
            {pending ? "Submitting…" : "Submit dispute"}
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
