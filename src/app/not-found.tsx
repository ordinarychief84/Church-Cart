import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold text-brand-700">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">We can&apos;t find that page.</h1>
      <p className="mt-2 text-sm text-slate-500">
        The link may be broken, or the page may have been moved.
      </p>
      <Link
        href="/"
        className="mt-4 inline-flex h-10 items-center rounded-md bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800"
      >
        Back to home
      </Link>
    </div>
  );
}
