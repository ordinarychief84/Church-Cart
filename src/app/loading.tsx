export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-7xl items-center justify-center px-4 py-16">
      <div className="flex items-center gap-3 text-slate-500">
        <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-brand-600" />
        <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-brand-600 [animation-delay:120ms]" />
        <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-brand-600 [animation-delay:240ms]" />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}
