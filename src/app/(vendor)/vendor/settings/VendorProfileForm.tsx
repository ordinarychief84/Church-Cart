"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { VendorProfile } from "@prisma/client";
import { upsertVendorProfileAction } from "@/app/actions/vendor";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
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

export function VendorProfileForm({ initial: vendor }: { initial: VendorProfile | null }) {
  const [state, action] = useFormState(upsertVendorProfileAction, initial);

  return (
    <Card>
      <CardBody>
        <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Business name" name="businessName" defaultValue={vendor?.businessName} state={state} required />
          <Field label="CAC number (optional)" name="cacNumber" defaultValue={vendor?.cacNumber || ""} state={state} />
          <Field label="Church affiliation (optional)" name="churchAffiliation" defaultValue={vendor?.churchAffiliation || ""} state={state} />
          <Field label="Phone" name="phone" placeholder="+2348012345678" defaultValue={vendor?.phone} state={state} required />
          <Field label="Address" name="address" defaultValue={vendor?.address} state={state} required wide />
          <Field label="City" name="city" defaultValue={vendor?.city} state={state} required />
          <Field label="State" name="state" defaultValue={vendor?.state} state={state} required />
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} defaultValue={vendor?.description || ""} />
          </div>
          {state.error && <p className="sm:col-span-2 text-sm text-red-600">{state.error}</p>}
          {state.ok && <p className="sm:col-span-2 text-sm text-emerald-700">Saved.</p>}
          <div className="sm:col-span-2">
            <SubmitBtn existing={!!vendor} />
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  wide,
  state,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  wide?: boolean;
  state: { fieldErrors?: Record<string, string[]> };
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} required={required} />
      {state.fieldErrors?.[name] && <p className="mt-1 text-xs text-red-600">{state.fieldErrors[name][0]}</p>}
    </div>
  );
}
