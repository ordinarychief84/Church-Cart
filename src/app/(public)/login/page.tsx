import Link from "next/link";
import { Suspense } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
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
          <Suspense fallback={<div className="h-40 animate-pulse rounded bg-slate-100" />}>
            <LoginForm />
          </Suspense>
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
