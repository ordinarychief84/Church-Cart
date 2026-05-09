import Link from "next/link";
import { ChurchIcon, ShieldCheck, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/marketplace/ProductCard";

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { available: true, vendor: { status: "VERIFIED" } },
    include: { images: { orderBy: { position: "asc" } }, vendor: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-3 py-1 text-xs font-medium text-gold-800">
                Worship Mate Marketplace
              </span>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Trusted Christian commerce, with pickup at your church.
              </h1>
              <p className="mt-4 max-w-xl text-base text-slate-600">
                Order from verified Christian vendors across Nigeria. Choose home delivery or have
                your order sent to your local church branch — RCCG, Winners, Christ Embassy and more.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/marketplace"
                  className="inline-flex h-12 items-center rounded-md bg-brand-700 px-6 text-base font-medium text-white hover:bg-brand-800"
                >
                  Browse marketplace
                </Link>
                <Link
                  href="/church-pickup"
                  className="inline-flex h-12 items-center rounded-md border border-slate-300 bg-white px-6 text-base font-medium text-slate-900 hover:bg-slate-50"
                >
                  How church pickup works
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Feature
                icon={<ShieldCheck className="text-brand-700" />}
                title="Verified vendors"
                body="Every seller is reviewed before they can list."
              />
              <Feature
                icon={<ChurchIcon className="text-brand-700" />}
                title="Church pickup"
                body="Pick up at your local branch, weekday or Sunday."
              />
              <Feature
                icon={<Truck className="text-brand-700" />}
                title="Home delivery"
                body="Doorstep delivery is available nationwide."
              />
              <Feature
                icon={<ShieldCheck className="text-brand-700" />}
                title="Buyer protection"
                body="Open a dispute within 48 hours if anything is off."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-xl font-semibold tracking-tight">New on churchCart</h2>
          <Link href="/marketplace" className="text-sm font-medium text-brand-700 hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-2">{icon}</div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}
