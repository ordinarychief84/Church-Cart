"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { changePasswordAction } from "@/app/actions/account";

const initial = {} as { ok?: true; error?: string; fieldErrors?: Record<string, string[]> };

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Updating…" : "Update password"}
    </Button>
  );
}

export function PasswordForm() {
  const [state, action] = useFormState(changePasswordAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear inputs after a successful change so the password isn't sitting in the DOM.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-900">Password</h2>
        <p className="text-xs text-slate-500">
          Pick a password at least 8 characters long. We&apos;ll sign you out of other devices when supported.
        </p>
      </CardHeader>
      <CardBody>
        <form ref={formRef} action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
            {state.fieldErrors?.currentPassword && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.currentPassword[0]}</p>
            )}
          </div>
          <div>
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
            />
            {state.fieldErrors?.newPassword && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.newPassword[0]}</p>
            )}
          </div>
          <div>
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
            />
            {state.fieldErrors?.confirm && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.confirm[0]}</p>
            )}
          </div>
          {state.error && <p className="sm:col-span-2 text-sm text-red-600">{state.error}</p>}
          {state.ok && <p className="sm:col-span-2 text-sm text-emerald-700">Password updated.</p>}
          <div className="sm:col-span-2">
            <SaveBtn />
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
