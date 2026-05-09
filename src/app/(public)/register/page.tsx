"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { registerAction, type FormState } from "@/app/actions/auth";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initial: FormState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

export default function RegisterPage() {
  const [state, action] = useFormState(registerAction, initial);
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Create your churchCart account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pick the role that fits you. You can use email, phone, or both.
        </p>
      </div>
      <Card>
        <CardBody>
          <form action={action} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" placeholder="Adaeze Okeke" required />
              {state.fieldErrors?.fullName && (
                <p className="mt-1 text-xs text-red-600">{state.fieldErrors.fullName[0]}</p>
              )}
            </div>
            <div>
              <Label htmlFor="role">I am a…</Label>
              <Select id="role" name="role" defaultValue="BUYER" required>
                <option value="BUYER">Buyer</option>
                <option value="VENDOR">Vendor (sell on churchCart)</option>
                <option value="CHURCH_ADMIN">Church admin (host pickup)</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="email">Email (optional if phone given)</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" />
              {state.fieldErrors?.email && (
                <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email[0]}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone (optional if email given)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="08012345678"
              />
              <p className="mt-1 text-xs text-slate-500">
                Nigerian numbers like 08012345678 work. We&apos;ll format it for you.
              </p>
              {state.fieldErrors?.phone && (
                <p className="mt-1 text-xs text-red-600">{state.fieldErrors.phone[0]}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" required />
              {state.fieldErrors?.password && (
                <p className="mt-1 text-xs text-red-600">{state.fieldErrors.password[0]}</p>
              )}
            </div>
            {state.error && <p className="text-sm text-red-600">{state.error}</p>}
            <SubmitBtn />
          </form>
        </CardBody>
      </Card>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
