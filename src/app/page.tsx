import Link from "next/link";
import { ChurchIcon, ShieldCheck, ShoppingBag, Store } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { DiamondMark } from "@/components/brand/Logo";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--cp-cream)]">
      <TopNav />
      <main className="flex-1">
        {/* Hero — cocoa-deep background per brand doc */}
        <section className="relative overflow-hidden bg-[color:var(--cp-cocoa-deep)] text-white">
          {/* Decorative cocoa-mid circles (top-right), opacity 0.15 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full"
            style={{ background: "var(--cp-cocoa-mid)", opacity: 0.18 }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-12 top-40 h-40 w-40 rounded-full"
            style={{ background: "var(--cp-cocoa-mid)", opacity: 0.12 }}
          />

          <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--cp-gold)]/40 px-3 py-1 font-ui text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--cp-gold)]">
              Kingdom Marketplace
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Buy. Sell. Serve.
              <br />
              <span className="text-[color:var(--cp-gold)]">Within the Kingdom.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl font-editorial text-lg italic leading-relaxed text-white/75">
              A community-driven marketplace built only for Nigerian church members. Every seller is
              a verified congregation member. Every pickup happens at a trusted local branch.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/register?role=BUYER"
                className="inline-flex h-12 items-center rounded-md bg-[color:var(--cp-gold)] px-6 font-ui text-sm font-medium tracking-wide text-[color:var(--cp-cocoa-deep)] transition-colors hover:bg-[color:var(--cp-gold-light)]"
              >
                Join the community
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex h-12 items-center rounded-md border-[1.5px] border-[color:var(--cp-gold)] bg-transparent px-6 font-ui text-sm font-medium tracking-wide text-[color:var(--cp-gold)] transition-colors hover:bg-[color:var(--cp-gold)] hover:text-[color:var(--cp-cocoa-deep)]"
              >
                Browse marketplace
              </Link>
            </div>

            {/* Gold rule separator */}
            <div
              aria-hidden="true"
              className="mx-auto mt-14 h-px w-32"
              style={{ background: "rgba(219,164,74,0.6)" }}
            />

            <div className="mt-6 flex items-center justify-center gap-3 font-ui text-[11px] uppercase tracking-[0.18em] text-white/50">
              <DiamondMark size={28} variant="dark" />
              Church Potal · Nigeria
            </div>
          </div>
        </section>

        {/* Three pillars */}
        <section className="mx-auto grid max-w-5xl gap-4 px-6 py-16 sm:grid-cols-3">
          <Pillar
            icon={<ShoppingBag size={20} />}
            title="For members"
            body="Shop verified Christian businesses and collect at your home church branch."
          />
          <Pillar
            icon={<Store size={20} />}
            title="For sellers"
            body="List digital and physical products. Get paid in Naira through Paystack."
          />
          <Pillar
            icon={<ChurchIcon size={20} />}
            title="For churches"
            body="Serve your members by hosting pickups — no warehouse, just a contact person."
          />
        </section>

        {/* Trust callout */}
        <section className="mx-auto max-w-3xl px-6 py-12 text-center">
          <div className="rounded-xl border border-[color:var(--cp-rule)] bg-white p-6 font-editorial text-sm leading-relaxed text-[color:var(--cp-cocoa-deep)]">
            <div className="flex items-center justify-center gap-2 font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--cp-cocoa-mid)]">
              <ShieldCheck size={14} className="text-[color:var(--cp-success)]" /> Paystack escrow
            </div>
            <p className="mt-3 italic">
              Every payment is held in Paystack escrow until your order is delivered or picked up.
              Sellers get paid. Members stay protected.
            </p>
          </div>
        </section>

        <footer className="border-t border-[color:var(--cp-rule)] bg-[color:var(--cp-cream)] py-8 text-center font-ui text-[11px] uppercase tracking-[0.18em] text-[color:var(--cp-mid)]">
          Buy · Sell · Serve · Within the Kingdom
        </footer>
      </main>
    </div>
  );
}

function Pillar({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--cp-rule)] bg-white p-6 transition-colors hover:border-[color:var(--cp-gold)]">
      <div className="grid h-10 w-10 place-items-center rounded-md bg-[color:var(--cp-sand)] text-[color:var(--cp-cocoa-deep)]">
        {icon}
      </div>
      <p className="mt-4 font-editorial text-lg font-bold text-[color:var(--cp-cocoa-deep)]">
        {title}
      </p>
      <p className="mt-2 font-editorial text-sm leading-relaxed text-[color:var(--cp-cocoa-mid)]">
        {body}
      </p>
    </div>
  );
}
