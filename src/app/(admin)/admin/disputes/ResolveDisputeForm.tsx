"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { resolveDisputeAction } from "@/app/actions/admin";

export function ResolveDisputeForm({ disputeId }: { disputeId: string }) {
  const [resolution, setResolution] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="mt-3 grid gap-2">
      <Textarea
        rows={3}
        placeholder="Resolution note"
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={pending || !resolution}
          onClick={() => start(async () => { await resolveDisputeAction(disputeId, resolution, "RESOLVED"); router.refresh(); })}
        >
          Resolve
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={pending || !resolution}
          onClick={() => start(async () => { await resolveDisputeAction(disputeId, resolution, "REJECTED"); router.refresh(); })}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
