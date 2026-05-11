"use client";

import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { signUpAction, type FormState } from "@/app/actions/auth";
import { Button } from "@/components/ui";

const initial: FormState = {};

const VALID_ROLES = new Set(["BUYER", "SELLER", "CHURCH_ADMIN"]);

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

export function RegisterForm() {
  const params = useSearchParams();
  const requestedRole = params.get("role");
  const defaultRole = requestedRole && VALID_ROLES.has(requestedRole) ? requestedRole : "BUYER";
  const [state, action] = useFormState(signUpAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="fullName" className="input-label">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          required
          placeholder="Adaeze Okeke"
          className="input"
        />
        {state.fieldErrors?.fullName && (
          <p className="input-error">{state.fieldErrors.fullName[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="role" className="input-label">
          I am a…
        </label>
        <select
          id="role"
          name="role"
          defaultValue={defaultRole}
          required
          className="input"
        >
          <option value="BUYER">Member (shopping)</option>
          <option value="SELLER">Seller (listing products)</option>
          <option value="CHURCH_ADMIN">Church admin (hosting pickups)</option>
        </select>
      </div>

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
        <label htmlFor="phone" className="input-label">
          Phone (optional)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="08012345678"
          className="input"
        />
        {state.fieldErrors?.phone && (
          <p className="input-error">{state.fieldErrors.phone[0]}</p>
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
          autoComplete="new-password"
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
