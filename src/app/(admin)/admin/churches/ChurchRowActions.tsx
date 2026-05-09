"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ChurchStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { approveChurchAction, rejectChurchAction } from "@/app/actions/admin";

export function ChurchRowActions({ churchId, status }: { churchId: string; status: ChurchStatus }) {
  const [pending, start] = useTransition();
  const [show, setShow] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "APPROVED" && (
        <Button size="sm" disabled={pending} onClick={() => start(async () => { await approveChurchAction(churchId); router.refresh(); })}>
          Approve
        </Button>
      )}
      {status !== "REJECTED" && (
        <Button size="sm" variant="danger" onClick={() => setShow((s) => !s)}>
          Reject
        </Button>
      )}
      {show && (
        <span className="flex items-center gap-1">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
          <Button
            variant="danger"
            size="sm"
            disabled={pending || !reason}
            onClick={() =>
              start(async () => {
                await rejectChurchAction(churchId, reason);
                setShow(false);
                router.refresh();
              })
            }
          >
            Confirm
          </Button>
        </span>
      )}
    </div>
  );
}
