"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signInAction, type FormState } from "@/app/actions/auth";
import { Button } from "@/components/ui";

const initial: FormState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function LoginForm() {
  const [state, action] = useFormState(signInAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="input-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
        />
        {state.fieldErrors?.email && (
          <p className="input-error">{state.fieldErrors.email[0]}</p>
        )}
      </div>
      <div>
        <label htmlFor="password" className="input-label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
        {state.fieldErrors?.password && (
          <p className="input-error">{state.fieldErrors.password[0]}</p>
        )}
      </div>
      {state.error && (
        <p className="text-body-sm text-[color:var(--cp-error)]">{state.error}</p>
      )}
      <SubmitBtn />
    </form>
  );
}
