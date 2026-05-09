"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { loginAction, type FormState } from "@/app/actions/auth";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initial: FormState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function LoginForm() {
  const [state, action] = useFormState(loginAction, initial);
  const params = useSearchParams();
  const from = params.get("from") || "";

  return (
    <form action={action} className="flex flex-col gap-4">
      {from && <input type="hidden" name="from" value={from} />}
      <div>
        <Label htmlFor="identifier">Email or phone</Label>
        <Input
          id="identifier"
          name="identifier"
          placeholder="you@example.com or 08012345678"
          autoComplete="username"
          required
        />
        {state.fieldErrors?.identifier && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.identifier[0]}</p>
        )}
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitBtn />
    </form>
  );
}
