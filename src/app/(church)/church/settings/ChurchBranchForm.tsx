"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { ChurchBranch } from "@prisma/client";
import { upsertChurchBranchAction } from "@/app/actions/church";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initial = {} as { ok?: true; error?: string; fieldErrors?: Record<string, string[]> };

function SubmitBtn({ existing }: { existing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : existing ? "Save changes" : "Submit for approval"}
    </Button>
  );
}

export function ChurchBranchForm({ initial: branch }: { initial: ChurchBranch | null }) {
  const [state, action] = useFormState(upsertChurchBranchAction, initial);
  return (
    <Card>
      <CardBody>
        <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <F label="Church name" name="churchName" defaultValue={branch?.churchName} state={state} required placeholder="e.g. RCCG" />
          <F label="Denomination" name="denomination" defaultValue={branch?.denomination} state={state} required placeholder="e.g. Pentecostal" />
          <F label="Branch name" name="branchName" defaultValue={branch?.branchName} state={state} required wide />
          <F label="Address" name="address" defaultValue={branch?.address} state={state} required wide />
          <F label="City" name="city" defaultValue={branch?.city} state={state} required />
          <F label="State" name="state" defaultValue={branch?.state} state={state} required />
          <F label="Contact person" name="contactPerson" defaultValue={branch?.contactPerson} state={state} required />
          <F label="Contact phone" name="contactPhone" defaultValue={branch?.contactPhone} state={state} required placeholder="+2348012345678" />
          <F label="Operating days" name="operatingDays" defaultValue={branch?.operatingDays} state={state} required placeholder="Mon-Fri,Sun" />
          <F label="Operating hours" name="operatingHours" defaultValue={branch?.operatingHours} state={state} required placeholder="09:00-18:00" />
          <F label="Pickup capacity" name="pickupCapacity" defaultValue={String(branch?.pickupCapacity ?? 50)} state={state} required type="number" />
          {state.error && <p className="sm:col-span-2 text-sm text-red-600">{state.error}</p>}
          {state.ok && <p className="sm:col-span-2 text-sm text-emerald-700">Saved.</p>}
          <div className="sm:col-span-2">
            <SubmitBtn existing={!!branch} />
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function F({
  label,
  name,
  defaultValue,
  required,
  wide,
  placeholder,
  type,
  state,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  wide?: boolean;
  placeholder?: string;
  type?: string;
  state: { fieldErrors?: Record<string, string[]> };
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue ?? ""} required={required} placeholder={placeholder} type={type} />
      {state.fieldErrors?.[name] && <p className="mt-1 text-xs text-red-600">{state.fieldErrors[name][0]}</p>}
    </div>
  );
}
