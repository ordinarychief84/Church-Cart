"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, type FormState } from "@/app/actions/auth";
import { Card, CardBody } from "@/components/ui/Card";
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

export default function LoginPage() {
  const [state, action] = useFormState(loginAction, initial);
  const params = useSearchParams();
  const from = params.get("from") || "";

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in with your email or Nigerian phone number.
        </p>
      </div>
      <Card>
        <CardBody>
          <form action={action} className="flex flex-col gap-4">
            <input type="hidden" name="from" value={from} />
            <div>
              <Label htmlFor="identifier">Email or phone</Label>
              <Input
                id="identifier"
                name="identifier"
                placeholder="you@example.com or +2348012345678"
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
        </CardBody>
      </Card>
      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-brand-700 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
