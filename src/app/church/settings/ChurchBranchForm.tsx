"use client";

import { useFormState, useFormStatus } from "react-dom";
import { upsertChurchBranchAction, type Result } from "@/app/actions/church";
import { Button } from "@/components/ui";
import { DENOMINATIONS, DENOMINATION_LABELS } from "@/lib/validation";
import type { ChurchBranch } from "@/lib/supabase/types";

const initial: Result = {};

const PICKUP_DAY_PRESETS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function SubmitBtn({ existing }: { existing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : existing ? "Save changes" : "Submit for review"}
    </Button>
  );
}

export function ChurchBranchForm({
  initial: branch,
  contactDefault,
}: {
  initial: ChurchBranch | null;
  contactDefault: string;
}) {
  const [state, action] = useFormState(upsertChurchBranchAction, initial);

  return (
    <form action={action} className="card">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="denomination">Denomination</Label>
          <select
            id="denomination"
            name="denomination"
            defaultValue={branch?.denomination ?? "RCCG"}
            required
            className="input"
          >
            {DENOMINATIONS.map((d) => (
              <option key={d} value={d}>
                {DENOMINATION_LABELS[d]}
              </option>
            ))}
          </select>
          <FieldError errors={state.fieldErrors?.denomination} />
        </div>
        <Field
          label="Branch name"
          name="branch_name"
          defaultValue={branch?.branch_name ?? ""}
          placeholder="e.g. City of David Parish"
          required
          error={state.fieldErrors?.branch_name}
        />
        <Field
          label="Street address"
          name="address"
          defaultValue={branch?.address ?? ""}
          placeholder="e.g. Plot 51 Ahmadu Bello Way"
          required
          error={state.fieldErrors?.address}
          wide
        />
        <Field
          label="City / district"
          name="city"
          defaultValue={branch?.city ?? ""}
          placeholder="e.g. Lekki"
          required
          error={state.fieldErrors?.city}
        />
        <Field
          label="State"
          name="state"
          defaultValue={branch?.state ?? ""}
          placeholder="e.g. Lagos or FCT"
          required
          error={state.fieldErrors?.state}
        />
        <Field
          label="Contact person"
          name="contact_person"
          defaultValue={branch?.contact_person ?? contactDefault}
          placeholder="e.g. Pastor Adebayo"
          required
          error={state.fieldErrors?.contact_person}
        />
        <Field
          label="Contact phone"
          name="contact_phone"
          defaultValue={branch?.contact_phone ?? ""}
          placeholder="08012345678"
          required
          error={state.fieldErrors?.contact_phone}
        />
        <Field
          label="Available pickup days"
          name="operating_days"
          defaultValue={branch?.operating_days ?? "Mon-Fri,Sun"}
          placeholder="Mon-Fri,Sun"
          required
          error={state.fieldErrors?.operating_days}
          hint={`Quick formats: ${PICKUP_DAY_PRESETS.slice(0, 4).join(",")}, or a range like Mon-Fri,Sun`}
        />
        <Field
          label="Pickup hours (24h)"
          name="operating_hours"
          defaultValue={branch?.operating_hours ?? "09:00-18:00"}
          placeholder="09:00-18:00"
          required
          error={state.fieldErrors?.operating_hours}
        />
        <Field
          label="Pickup capacity (packages at a time)"
          name="pickup_capacity"
          defaultValue={String(branch?.pickup_capacity ?? 50)}
          type="number"
          required
          error={state.fieldErrors?.pickup_capacity}
        />
      </div>

      {state.error && (
        <p className="mt-4 text-body-sm text-[color:var(--cp-error)]">{state.error}</p>
      )}
      {state.ok && (
        <p className="mt-4 text-body-sm text-[color:var(--cp-success)]">Saved.</p>
      )}

      <div className="mt-6">
        <SubmitBtn existing={!!branch} />
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  wide,
  error,
  hint,
  type,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  wide?: boolean;
  error?: string[];
  hint?: string;
  type?: string;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <Label htmlFor={name}>{label}</Label>
      <input
        id={name}
        name={name}
        type={type ?? "text"}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        className="input"
      />
      {hint && <p className="mt-1 text-tag text-[color:var(--cp-cocoa-mid)]">{hint}</p>}
      {error && <p className="input-error">{error[0]}</p>}
    </div>
  );
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="input-label">
      {children}
    </label>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="input-error">{errors[0]}</p>;
}
