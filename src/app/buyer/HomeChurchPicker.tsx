"use client";

import { useFormState, useFormStatus } from "react-dom";
import { setHomeChurchAction, type Result } from "@/app/actions/buyer";
import { Button } from "@/components/ui";
import { DENOMINATION_LABELS } from "@/lib/validation";
import type { ChurchBranch } from "@/lib/supabase/types";

const initial: Result = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Save home church"}
    </Button>
  );
}

export function HomeChurchPicker({
  branches,
  initialBranchId,
}: {
  branches: Pick<ChurchBranch, "id" | "denomination" | "branch_name" | "city" | "state">[];
  initialBranchId: string | null;
}) {
  const [state, action] = useFormState(setHomeChurchAction, initial);
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="home_church_branch_id" className="input-label">
          Pick a branch
        </label>
        <select
          id="home_church_branch_id"
          name="home_church_branch_id"
          defaultValue={initialBranchId ?? ""}
          className="input"
        >
          <option value="">— no home church —</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {DENOMINATION_LABELS[b.denomination]} — {b.branch_name} ({b.city}, {b.state})
            </option>
          ))}
        </select>
        {state.error && <p className="input-error">{state.error}</p>}
        {state.ok && (
          <p className="mt-1 text-tag text-[color:var(--cp-success)]">Saved.</p>
        )}
      </div>
      <SubmitBtn />
    </form>
  );
}
