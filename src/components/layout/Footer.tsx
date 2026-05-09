export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} churchCart · Worship Mate Marketplace</p>
        <p className="text-slate-400">justhazaar.com — built for the Body of Christ in Nigeria.</p>
      </div>
    </footer>
  );
}
