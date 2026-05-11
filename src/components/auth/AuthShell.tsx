import Link from "next/link";
import { LogoLockup, DiamondMark } from "@/components/brand/Logo";

/**
 * Split-panel auth layout per CHURCH_POTAL_BRAND.md §5 (Authentication Pages):
 *   - Left half: --cp-cocoa-deep, logo centred, brand quote
 *   - Right half: --cp-cream, the form
 *   - Gold accent on focus states comes from globals.css :focus-visible
 *
 * On mobile the cocoa panel collapses to a short top band so the form stays
 * the focus.
 */
export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[color:var(--cp-cream)] lg:grid lg:grid-cols-2">
      {/* Cocoa-deep brand panel */}
      <aside className="relative overflow-hidden bg-[color:var(--cp-cocoa-deep)] text-white">
        {/* Decorative circles top-right */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
          style={{ background: "var(--cp-cocoa-mid)", opacity: 0.2 }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full"
          style={{ background: "var(--cp-cocoa-mid)", opacity: 0.15 }}
        />

        <div className="relative flex h-full flex-col items-center justify-center px-8 py-12 lg:py-20">
          <Link href="/" aria-label="Church Potal home">
            <LogoLockup variant="dark" size="lg" withTagline />
          </Link>

          <p className="mt-10 max-w-sm text-center font-editorial text-lg italic leading-relaxed text-white/75">
            Buy. Sell. Serve. Within the Kingdom.
          </p>

          <div className="gold-rule mt-8 w-24" />

          <p className="mt-6 max-w-sm text-center font-ui text-[11px] uppercase tracking-[0.2em] text-white/50">
            A trusted marketplace for Nigerian church members
          </p>
        </div>
      </aside>

      {/* Cream form panel */}
      <main className="flex min-h-screen items-center justify-center px-6 py-12 lg:min-h-0">
        <div className="w-full max-w-md">
          {/* Mobile-only mark to anchor the brand even when the cocoa panel
              isn't visible. Hidden on lg+ since the left panel has it. */}
          <div className="mb-6 flex justify-center lg:hidden">
            <DiamondMark size={48} variant="light" />
          </div>

          {eyebrow && (
            <p className="text-label text-[color:var(--cp-cocoa-mid)]">{eyebrow}</p>
          )}
          <h1 className="text-h1 mt-1 text-[color:var(--cp-cocoa-deep)]">{title}</h1>
          {intro && (
            <p className="text-body-sm mt-2 text-[color:var(--cp-cocoa-mid)]">{intro}</p>
          )}

          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
