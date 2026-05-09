"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold text-red-700">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">We hit a snag.</h1>
      <p className="mt-2 text-sm text-slate-500">
        Please try again. If this keeps happening, head back to home and we&apos;ll keep an eye on it.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center rounded-md bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium hover:bg-slate-50"
        >
          Back home
        </Link>
      </div>
      {error.digest && <p className="mt-4 font-mono text-xs text-slate-400">ref: {error.digest}</p>}
    </div>
  );
}
