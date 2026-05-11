import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { RegisterForm } from "./RegisterForm";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Join the community"
      title="Create your account"
      intro="Pick the role that fits you today. You can ask support to change it later."
    >
      <GoogleSignInButton label="Continue with Google" />

      <div className="my-5 flex items-center gap-3 text-tag text-[color:var(--cp-mid)]">
        <span className="h-px flex-1 bg-[color:var(--cp-rule)]" />
        or with email
        <span className="h-px flex-1 bg-[color:var(--cp-rule)]" />
      </div>

      <Suspense fallback={<div className="h-60 animate-pulse rounded bg-[color:var(--cp-sand)]" />}>
        <RegisterForm />
      </Suspense>

      <p className="mt-6 text-center text-body-sm text-[color:var(--cp-cocoa-mid)]">
        Already part of the community?{" "}
        <Link
          href="/login"
          className="font-medium text-[color:var(--cp-gold)] hover:underline"
        >
          Welcome back
        </Link>
      </p>
    </AuthShell>
  );
}
