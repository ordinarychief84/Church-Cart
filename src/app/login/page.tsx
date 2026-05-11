import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to continue"
      intro="Pick up where you left off. Track orders, finish a listing, or check your pickup branch."
    >
      {searchParams.error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border p-3 text-body-sm"
          style={{ background: "#FEEFE9", borderColor: "#F4B7A8", color: "#842029" }}
        >
          {searchParams.error}
        </div>
      )}

      <GoogleSignInButton next={searchParams.next} />

      <div className="my-5 flex items-center gap-3 text-tag text-[color:var(--cp-mid)]">
        <span className="h-px flex-1 bg-[color:var(--cp-rule)]" />
        or with email
        <span className="h-px flex-1 bg-[color:var(--cp-rule)]" />
      </div>

      <Suspense fallback={<div className="h-40 animate-pulse rounded bg-[color:var(--cp-sand)]" />}>
        <LoginForm />
      </Suspense>

      <p className="mt-6 text-center text-body-sm text-[color:var(--cp-cocoa-mid)]">
        New to Church Potal?{" "}
        <Link
          href="/register"
          className="font-medium text-[color:var(--cp-gold)] hover:underline"
        >
          Join the community
        </Link>
      </p>
    </AuthShell>
  );
}
