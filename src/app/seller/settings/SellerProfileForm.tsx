"use client";

import { useFormState, useFormStatus } from "react-dom";
import { upsertSellerProfileAction, type Result } from "@/app/actions/seller";
import { Button } from "@/components/ui";
import type { Seller } from "@/lib/supabase/types";
import { DENOMINATIONS, DENOMINATION_LABELS } from "@/lib/validation";

const initial: Result = {};

function SubmitBtn({ existing }: { existing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : existing ? "Save changes" : "Submit for review"}
    </Button>
  );
}

export function SellerProfileForm({
  initial: seller,
  userName,
}: {
  initial: Seller | null;
  userName: string;
}) {
  const [state, action] = useFormState(upsertSellerProfileAction, initial);
  return (
    <form action={action} className="card">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Business name"
          name="business_name"
          defaultValue={seller?.business_name ?? userName}
          error={state.fieldErrors?.business_name}
          required
          wide
        />
        <Field
          label="CAC number (optional)"
          name="cac_number"
          defaultValue={seller?.cac_number ?? ""}
          error={state.fieldErrors?.cac_number}
        />
        <div>
          <Label htmlFor="church_affiliation">Church affiliation (optional)</Label>
          <select
            id="church_affiliation"
            name="church_affiliation"
            defaultValue={seller?.church_affiliation ?? ""}
            className="input"
          >
            <option value="">— select —</option>
            {DENOMINATIONS.map((d) => (
              <option key={d} value={d}>
                {DENOMINATION_LABELS[d]}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Phone"
          name="phone"
          defaultValue={seller?.phone ?? ""}
          placeholder="08012345678"
          error={state.fieldErrors?.phone}
          required
        />
        <Field
          label="City"
          name="city"
          defaultValue={seller?.city ?? ""}
          error={state.fieldErrors?.city}
          required
        />
        <Field
          label="State"
          name="state"
          defaultValue={seller?.state ?? ""}
          error={state.fieldErrors?.state}
          required
        />
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description (optional)</Label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={seller?.description ?? ""}
            placeholder="Tell members what you're about. A short paragraph is fine."
            className="input"
          />
        </div>
        <Field
          label="Logo URL (optional)"
          name="logo_url"
          defaultValue={seller?.logo_url ?? ""}
          placeholder="https://…"
          error={state.fieldErrors?.logo_url}
          wide
        />
      </div>

      {state.error && (
        <p className="mt-4 text-body-sm text-[color:var(--cp-error)]">{state.error}</p>
      )}
      {state.ok && (
        <p className="mt-4 text-body-sm text-[color:var(--cp-success)]">Saved.</p>
      )}

      <div className="mt-6">
        <SubmitBtn existing={!!seller} />
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
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  wide?: boolean;
  error?: string[];
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <Label htmlFor={name}>{label}</Label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        className="input"
      />
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
