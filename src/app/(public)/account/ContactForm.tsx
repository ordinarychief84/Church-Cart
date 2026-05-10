"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateContactAction } from "@/app/actions/account";

const initial = {} as { ok?: true; error?: string; fieldErrors?: Record<string, string[]> };

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

export function ContactForm({
  initial: data,
}: {
  initial: { fullName: string; email: string; phone: string };
}) {
  const [state, action] = useFormState(updateContactAction, initial);
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-900">Contact details</h2>
        <p className="text-xs text-slate-500">
          Either email or phone is required. We use these for sign-in and order updates.
        </p>
      </CardHeader>
      <CardBody>
        <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" defaultValue={data.fullName} required />
            {state.fieldErrors?.fullName && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.fullName[0]}</p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={data.email} placeholder="you@example.com" />
            {state.fieldErrors?.email && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email[0]}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={data.phone}
              placeholder="08012345678"
            />
            {state.fieldErrors?.phone && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.phone[0]}</p>
            )}
          </div>
          {state.error && <p className="sm:col-span-2 text-sm text-red-600">{state.error}</p>}
          {state.ok && <p className="sm:col-span-2 text-sm text-emerald-700">Saved.</p>}
          <div className="sm:col-span-2">
            <SaveBtn />
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
