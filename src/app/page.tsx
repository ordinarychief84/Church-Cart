import Link from "next/link";
import {
  CheckCircle2,
  ChurchIcon,
  Lock,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  UserCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { DiamondMark } from "@/components/brand/Logo";
import { LinkButton, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--cp-cream)]">
      <TopNav />
      <main className="flex-1">
        <Hero />
        <Problem />
        <HowItWorks />
        <ForBuyers />
        <ForSellers />
        <PickupSystem />
        <TrustVerification />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

/* ─── SECTION 1 ── HERO ─────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-[color:var(--cp-cocoa-deep)] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full"
        style={{ background: "var(--cp-cocoa-mid)", opacity: 0.18 }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-12 top-48 h-40 w-40 rounded-full"
        style={{ background: "var(--cp-cocoa-mid)", opacity: 0.12 }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full"
        style={{ background: "var(--cp-cocoa-mid)", opacity: 0.1 }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--cp-gold)]/40 px-3 py-1 font-ui text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--cp-gold)]">
          <Sparkles size={11} /> Kingdom Marketplace
        </span>
        <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
          The Kingdom Has a Marketplace.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl font-editorial text-lg italic leading-relaxed text-white/80">
          Church Potal is where Nigerian Christians buy, sell, and do business with one another.
          Verified members. Trusted sellers. Your church branch as your pickup point.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <LinkButton href="/register" size="lg">
            Join the Kingdom Marketplace
          </LinkButton>
          <a
            href="#how-it-works"
            className="btn-ghost cp-btn-lg"
          >
            See how it works
          </a>
        </div>

        <div
          aria-hidden="true"
          className="mx-auto mt-14 h-px w-32"
          style={{ background: "rgba(219,164,74,0.6)" }}
        />

        <p className="mt-6 mx-auto max-w-3xl font-ui text-[12px] uppercase tracking-[0.18em] text-white/55">
          Already trusted by members across RCCG, Winners Chapel, MFM, CAC and Deeper Life
          congregations.
        </p>

        <div className="mt-4 flex items-center justify-center">
          <DiamondMark size={28} variant="dark" />
        </div>
      </div>
    </section>
  );
}

/* ─── SECTION 2 ── PROBLEM ──────────────────────────────────────────────── */
function Problem() {
  return (
    <section className="border-b border-[color:var(--cp-rule)]">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-label text-center text-[color:var(--cp-cocoa-mid)]">
          Why Church Potal Exists
        </p>
        <h2 className="text-h1 mx-auto mt-2 max-w-3xl text-center text-[color:var(--cp-cocoa-deep)]">
          Your Money Leaves the Kingdom Every Day.
        </h2>
        <div className="mx-auto mt-6 max-w-3xl space-y-4 font-editorial text-base leading-relaxed text-[color:var(--cp-cocoa-deep)]">
          <p>
            Every time a church member buys from a stranger, wealth flows out of the body of
            Christ. The trader in your congregation goes unseen. The designer three rows behind you
            has no platform. The farmer in your cell group cannot reach the people who would trust
            him most.
          </p>
          <p className="font-bold">Church Potal was built to change that.</p>
          <p>
            We are a marketplace built inside the church community, so that kingdom money stays in
            kingdom hands, and kingdom members build kingdom businesses together.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <StatCard
            big="Millions"
            label="of Nigerian Christians"
            tail="transact outside their church community every week."
          />
          <StatCard
            big="Zero"
            label="platforms exist"
            tail="built specifically for church members to trade with each other."
          />
          <StatCard
            big="One"
            label="solution"
            tail="that puts your church branch at the centre of every transaction."
          />
        </div>
      </div>
    </section>
  );
}

function StatCard({ big, label, tail }: { big: string; label: string; tail: string }) {
  return (
    <Card>
      <p className="font-display text-4xl font-bold text-[color:var(--cp-gold)]">{big}</p>
      <p className="mt-2 font-editorial text-base font-bold text-[color:var(--cp-cocoa-deep)]">
        {label}
      </p>
      <p className="mt-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">{tail}</p>
    </Card>
  );
}

/* ─── SECTION 3 ── HOW IT WORKS ─────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Join with your church membership",
      body: "Sign up using your church and congregation details. Your membership is your identity on Church Potal. No anonymous strangers. Every member is accountable to their local congregation.",
      icon: UserCheck,
    },
    {
      n: "02",
      title: "Browse, buy or sell within your community",
      body: "Discover products and services listed by verified members of your denomination. List your own products in minutes. Set your price. Reach thousands of kingdom buyers.",
      icon: ShoppingBag,
    },
    {
      n: "03",
      title: "Pick up at your church branch",
      body: "No confusing delivery addresses. No strangers at your gate. Your order is dropped off at your church branch during service hours. Collect it in a space you already know and trust.",
      icon: ChurchIcon,
    },
  ] as const;

  return (
    <section id="how-it-works" className="bg-[color:var(--cp-sand)]/30 border-b border-[color:var(--cp-rule)]">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-label text-center text-[color:var(--cp-cocoa-mid)]">
          Simple. Trusted. Kingdom-powered.
        </p>
        <h2 className="text-h1 mt-2 text-center text-[color:var(--cp-cocoa-deep)]">
          Three Steps to Your First Kingdom Transaction
        </h2>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n}>
              <Card className="h-full">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base text-[color:var(--cp-gold)]">{s.n}</span>
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-[color:var(--cp-cocoa-deep)] text-[color:var(--cp-gold)]">
                    <s.icon size={18} />
                  </span>
                </div>
                <h3 className="mt-4 font-editorial text-lg font-bold text-[color:var(--cp-cocoa-deep)]">
                  {s.title}
                </h3>
                <p className="mt-2 text-body-sm leading-relaxed text-[color:var(--cp-cocoa-deep)]">
                  {s.body}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─── SECTION 4 ── FOR BUYERS ───────────────────────────────────────────── */
function ForBuyers() {
  const features: Feature[] = [
    {
      title: "Kingdom Verified Sellers",
      body: "Every seller is confirmed through their church membership. You know who you are buying from before you place a single order.",
      icon: ShieldCheck,
    },
    {
      title: "Church Branch Pickup",
      body: "Your church is your pickup point. Collect your order during service hours in the space you trust most.",
      icon: ChurchIcon,
    },
    {
      title: "Browse by Denomination",
      body: "Find sellers from your own denomination first. RCCG, Winners Chapel, MFM, CAC, Deeper Life. Shop within your fellowship.",
      icon: MapPin,
    },
    {
      title: "Secure Payments",
      body: "Every payment is processed securely before an order is confirmed. Your money is protected until you collect and confirm your order.",
      icon: Lock,
    },
    {
      title: "Order Tracking",
      body: "Follow every order from placement to your church branch pickup. You always know exactly where your order is.",
      icon: Package,
    },
    {
      title: "Member Reviews",
      body: "Leave honest feedback for sellers within your community. Build a culture of accountability and excellence inside the kingdom.",
      icon: Sparkles,
    },
  ];

  return (
    <section className="border-b border-[color:var(--cp-rule)]">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <SectionHeader
          label="For Church Members"
          title="Shop With People You Already Trust."
          intro="Every seller on Church Potal is a verified member of a Nigerian church congregation. You are not buying from a stranger. You are buying from the body of Christ."
        />

        <div className="mx-auto mt-6 max-w-3xl space-y-4 font-editorial text-base leading-relaxed text-[color:var(--cp-cocoa-deep)]">
          <p>
            You already know your congregation. You sit with them every Sunday. You pray together.
            You serve together.
          </p>
          <p className="italic">Now you can also buy from them.</p>
          <p>
            Church Potal lets you browse products and services listed by verified members of your
            denomination, pay securely, and collect your order at your own church branch. No
            unknown addresses. No delivery anxiety. No risk.
          </p>
          <p className="font-bold">Just community, doing business together.</p>
        </div>

        <FeatureGrid features={features} />

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <LinkButton href="/register?role=BUYER">Start Shopping in Your Community</LinkButton>
          <LinkButton href="/marketplace" variant="secondary">
            Browse kingdom sellers
          </LinkButton>
        </div>
      </div>
    </section>
  );
}

/* ─── SECTION 5 ── FOR SELLERS ──────────────────────────────────────────── */
function ForSellers() {
  const features: Feature[] = [
    {
      title: "Kingdom Verified Badge",
      body: "Complete your church membership verification and earn your Kingdom Verified status. Buyers know you are accountable to a real congregation. Trust is built before the first sale.",
      icon: ShieldCheck,
    },
    {
      title: "Your Seller Profile",
      body: "Build a professional storefront in minutes. Upload your products, write your descriptions, set your prices in Naira, and let your congregation find you.",
      icon: Store,
    },
    {
      title: "Church Branch Pickup Network",
      body: "You do not need to handle delivery yourself. Drop your orders at your designated church branch pickup point. Church Potal manages the rest.",
      icon: ChurchIcon,
    },
    {
      title: "Reach Beyond Your Branch",
      body: "Your products are visible to kingdom members across all denominations on the platform. One listing. Thousands of potential buyers. All within the body of Christ.",
      icon: MapPin,
    },
    {
      title: "Seller Dashboard",
      body: "Track your orders, manage your inventory, and monitor your earnings from one clean dashboard. Know exactly what has sold, what is pending pickup, and what has been collected.",
      icon: Package,
    },
    {
      title: "Get Paid Securely",
      body: "Payments are released to your account once your buyer confirms collection. No chargebacks from bad actors. No payment disputes from strangers. Kingdom accountability protects you on both sides.",
      icon: Wallet,
    },
    {
      title: "Zero Listing Fees to Start",
      body: "List your first products for free. Church Potal grows when you grow. We only succeed when kingdom sellers succeed.",
      icon: Sparkles,
    },
  ];

  return (
    <section className="bg-[color:var(--cp-cocoa-deep)] text-white">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <SectionHeader
          label="For Kingdom Sellers"
          title="Your Congregation Is Your First Customer Base."
          intro="List your products. Reach thousands of verified church members across Nigeria. Build a kingdom business with people who already share your values."
          variant="dark"
        />

        <div className="mx-auto mt-6 max-w-3xl space-y-4 font-editorial text-base leading-relaxed text-white/85">
          <p>You have a gift. A skill. A product. A service.</p>
          <p>But selling to strangers is hard. Trust is low. Fraud is real. Getting paid is a battle.</p>
          <p>
            Church Potal gives you something no general marketplace can: a community of buyers who
            already trust you because you share the same faith, the same congregation, and the same
            God.
          </p>
          <p>
            When you sell on Church Potal, you are not just running a business. You are building
            kingdom wealth, serving your brothers and sisters, and fulfilling the biblical mandate
            to work with excellence and integrity.
          </p>
          <p className="font-bold text-[color:var(--cp-gold)]">
            Your church branch handles the pickup. You focus on your product.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="card-dark"
              style={{ borderColor: "rgba(219,164,74,0.25)" }}
            >
              <div className="grid h-9 w-9 place-items-center rounded-md bg-[color:var(--cp-gold)] text-[color:var(--cp-cocoa-deep)]">
                <f.icon size={18} />
              </div>
              <p className="mt-3 font-editorial text-base font-bold text-white">{f.title}</p>
              <p className="mt-1 text-body-sm leading-relaxed text-white/75">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <LinkButton href="/register?role=SELLER">Start Selling to Your Congregation</LinkButton>
          <a href="#how-it-works" className="btn-ghost cp-btn-md">
            See how the seller dashboard works
          </a>
        </div>
        <p className="mt-6 text-center font-editorial italic text-white/70">
          Join hundreds of kingdom entrepreneurs already listing on Church Potal.
        </p>
      </div>
    </section>
  );
}

/* ─── SECTION 6 ── PICKUP SYSTEM ────────────────────────────────────────── */
function PickupSystem() {
  const denominations = [
    "Redeemed Christian Church of God (RCCG)",
    "Winners Chapel (Living Faith Church)",
    "Mountain of Fire and Miracles Ministries (MFM)",
    "Christ Apostolic Church (CAC)",
    "Deeper Life Bible Church",
    "And many more evangelical and Pentecostal congregations across Nigeria",
  ];

  return (
    <section className="border-b border-[color:var(--cp-rule)]">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <SectionHeader
          label="The Pickup Network"
          title="Your Church Branch Is Now a Delivery Hub."
          intro="Church Potal turns every registered church branch into a trusted, community-run pickup point. No logistics company. No courier. No stranger at your door."
        />

        <div className="mx-auto mt-6 max-w-3xl space-y-4 font-editorial text-base leading-relaxed text-[color:var(--cp-cocoa-deep)]">
          <p>Here is how it works.</p>
          <p>
            A buyer places an order from a verified kingdom seller. The seller prepares the order
            and drops it at their designated church branch pickup point. The buyer collects it at
            their own church branch during service hours.
          </p>
          <p className="italic">
            The church is the bridge. The community is the infrastructure. And trust is built into
            every step because every person involved is a member of a congregation accountable to
            God and to one another.
          </p>
        </div>

        <Card variant="surface" className="mx-auto mt-10 max-w-3xl">
          <p className="text-label text-[color:var(--cp-cocoa-mid)]">Supported denominations</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {denominations.map((d) => (
              <li
                key={d}
                className="flex items-start gap-2 text-body-sm text-[color:var(--cp-cocoa-deep)]"
              >
                <CheckCircle2
                  size={14}
                  className="mt-0.5 shrink-0 text-[color:var(--cp-gold)]"
                />
                {d}
              </li>
            ))}
          </ul>
        </Card>

        <div className="mt-10 flex justify-center">
          <LinkButton href="/register?role=CHURCH_ADMIN" leadingIcon={<ChurchIcon size={16} />}>
            Register your church branch as a pickup point
          </LinkButton>
        </div>
      </div>
    </section>
  );
}

/* ─── SECTION 7 ── TRUST & VERIFICATION ─────────────────────────────────── */
function TrustVerification() {
  const pillars = [
    {
      title: "Congregation-Verified Identity",
      body: "Every member signs up with their church and congregation details. Your identity on Church Potal is your church membership, not just an email address.",
      icon: UserCheck,
    },
    {
      title: "Community Accountability",
      body: "Bad behaviour on Church Potal is not just a platform issue. It is a congregation issue. Members are accountable to their church community, which creates a standard of integrity that no general marketplace can match.",
      icon: ShieldCheck,
    },
    {
      title: "Secure Transactions",
      body: "Every payment is held securely until the buyer confirms collection at their church branch. Money only moves when goods are received. No exceptions.",
      icon: Lock,
    },
  ];

  return (
    <section className="bg-[color:var(--cp-sand)]/30 border-b border-[color:var(--cp-rule)]">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <SectionHeader
          label="Kingdom Accountability"
          title="Every Member. Verified. Accountable."
          intro="Trust is not built by algorithms on Church Potal. It is built by church membership."
        />

        <div className="mx-auto mt-6 max-w-3xl space-y-4 font-editorial text-base leading-relaxed text-[color:var(--cp-cocoa-deep)]">
          <p>When you join Church Potal, your church membership is your identity.</p>
          <p>
            Every seller goes through a kingdom verification process tied to their local
            congregation. Buyers know exactly which church a seller belongs to. Sellers know their
            reputation extends beyond the platform into their church community.
          </p>
          <p className="italic">
            This is not anonymous e-commerce. This is commerce inside a community that prays
            together, worships together, and holds one another accountable.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {pillars.map((p) => (
            <Card key={p.title}>
              <div className="grid h-10 w-10 place-items-center rounded-md bg-[color:var(--cp-cocoa-deep)] text-[color:var(--cp-gold)]">
                <p.icon size={18} />
              </div>
              <p className="mt-3 font-editorial text-base font-bold text-[color:var(--cp-cocoa-deep)]">
                {p.title}
              </p>
              <p className="mt-1 text-body-sm leading-relaxed text-[color:var(--cp-cocoa-deep)]">
                {p.body}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── SECTION 8 ── TESTIMONIALS (placeholder slots) ─────────────────────── */
function Testimonials() {
  return (
    <section className="border-b border-[color:var(--cp-rule)]">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-label text-center text-[color:var(--cp-cocoa-mid)]">
          What Kingdom Members Are Saying
        </p>
        <h2 className="text-h1 mt-2 text-center text-[color:var(--cp-cocoa-deep)]">
          Real Voices. Real Members.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center font-editorial italic text-[color:var(--cp-cocoa-mid)]">
          Stories from real buyers, sellers and branch admins will appear here as Church Potal
          opens to early members. Want yours to be one of the first? Join the community below.
        </p>

        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          <PlaceholderTestimonial role="Member testimonial" />
          <PlaceholderTestimonial role="Seller testimonial" />
          <PlaceholderTestimonial role="Branch admin testimonial" />
        </ul>
      </div>
    </section>
  );
}

function PlaceholderTestimonial({ role }: { role: string }) {
  return (
    <li className="card flex h-full flex-col">
      <p className="text-tag text-[color:var(--cp-gold)]">{role}</p>
      <div
        aria-hidden="true"
        className="mt-3 h-2 w-16 rounded-full"
        style={{ background: "var(--cp-sand)" }}
      />
      <div className="mt-2 space-y-1.5">
        <div
          aria-hidden="true"
          className="h-2 w-full rounded-full"
          style={{ background: "var(--cp-sand)", opacity: 0.7 }}
        />
        <div
          aria-hidden="true"
          className="h-2 w-11/12 rounded-full"
          style={{ background: "var(--cp-sand)", opacity: 0.55 }}
        />
        <div
          aria-hidden="true"
          className="h-2 w-9/12 rounded-full"
          style={{ background: "var(--cp-sand)", opacity: 0.4 }}
        />
      </div>
      <p className="mt-auto pt-5 text-tag text-[color:var(--cp-cocoa-mid)]">
        Coming soon from early members
      </p>
    </li>
  );
}

/* ─── SECTION 9 ── FAQ ──────────────────────────────────────────────────── */
function Faq() {
  return (
    <section className="bg-[color:var(--cp-sand)]/30 border-b border-[color:var(--cp-rule)]">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-label text-center text-[color:var(--cp-cocoa-mid)]">
          Questions About Church Potal
        </p>
        <h2 className="text-h1 mt-2 text-center text-[color:var(--cp-cocoa-deep)]">
          Everything You Need to Know
        </h2>

        <FaqGroup title="General questions">
          <FaqItem q="What is Church Potal?">
            Church Potal is a kingdom marketplace built exclusively for Nigerian church members. It
            is a platform where Christians can buy, sell, and transact with one another, using
            verified church membership as the foundation of trust, and church branches as the
            pickup network for orders.
          </FaqItem>
          <FaqItem q="Who can join Church Potal?">
            Any active member of a Nigerian Christian church congregation can join Church Potal.
            You will be asked to provide your church name, branch, and membership details during
            signup. Both buyers and sellers must be verified church members.
          </FaqItem>
          <FaqItem q="Is Church Potal a church or a ministry?">
            No. Church Potal is a marketplace platform. We are not a denomination, a ministry, or a
            religious organisation. We are a technology platform that uses church membership as the
            trust layer for community commerce.
          </FaqItem>
          <FaqItem q="Which denominations are supported?">
            Church Potal currently supports members of RCCG, Winners Chapel, MFM, CAC, and Deeper
            Life Bible Church, with more denominations being added regularly. If your denomination
            is not listed, you can still join and we will work to add your church.
          </FaqItem>
          <FaqItem q="Is Church Potal only for Nigerians?">
            Church Potal is currently built for Nigerian church members and operates in Nigeria. We
            plan to expand to other African countries as the platform grows.
          </FaqItem>
          <FaqItem q="Is Church Potal free to join?">
            Joining Church Potal as a buyer is completely free. Sellers can list their first
            products for free. Paid plans for sellers with larger catalogues will be announced
            before launch.
          </FaqItem>
        </FaqGroup>

        <FaqGroup title="For buyers">
          <FaqItem q="How do I know a seller is trustworthy?">
            Every seller on Church Potal holds a Kingdom Verified badge, which means they have been
            confirmed as an active member of a registered church congregation. You can see which
            church and branch a seller belongs to on their profile. You are not buying from an
            anonymous stranger. You are buying from a congregation member.
          </FaqItem>
          <FaqItem q="How does pickup at my church branch work?">
            When you place an order, you select your church branch as your pickup location. The
            seller delivers your order to the designated pickup point at that branch. You will
            receive a notification when your order is ready for collection. Collect your order
            during service hours or at the arranged pickup time.
          </FaqItem>
          <FaqItem q="What if my church branch is not yet registered?">
            You can still place orders and choose from available pickup branches near you. You can
            also nominate your church branch for registration directly from your account. We will
            reach out to your church admin to get them set up.
          </FaqItem>
          <FaqItem q="What if something is wrong with my order?">
            Your payment is held securely until you confirm collection and satisfaction. If there
            is a problem with your order, you can raise a dispute before confirming receipt. Our
            team will review and resolve the issue fairly.
          </FaqItem>
          <FaqItem q="Can I buy from sellers in a different denomination?">
            Yes. While you can filter to see sellers from your own denomination first, all verified
            kingdom sellers are visible to all members on the platform. Every seller is verified,
            regardless of denomination.
          </FaqItem>
          <FaqItem q="What payment methods are accepted?">
            Church Potal accepts payment by card, bank transfer, and USSD. All payments are
            processed securely through our payment provider. Your payment details are never stored
            on Church Potal.
          </FaqItem>
        </FaqGroup>

        <FaqGroup title="For sellers">
          <FaqItem q="How do I become a verified kingdom seller?">
            After signing up, go to your seller dashboard and complete the Kingdom Verification
            process. You will be asked to provide your church name, branch, and membership
            details. Once verified, your Kingdom Verified badge will appear on your profile and all
            your listings.
          </FaqItem>
          <FaqItem q="What can I sell on Church Potal?">
            You can sell any legal product or service. Popular categories include food and
            groceries, fashion and fabric, handmade goods, home products, professional services,
            digital products, and farm produce. Any product that violates Nigerian law or conflicts
            with Christian values will be removed from the platform.
          </FaqItem>
          <FaqItem q="How do I handle delivery to the church pickup point?">
            As a seller, you are responsible for delivering orders to the designated church branch
            pickup point in your area. Church Potal will provide you with the pickup schedule and
            location details for each order. You do not need to deliver directly to buyers.
          </FaqItem>
          <FaqItem q="When do I get paid?">
            Payment is released to your account once the buyer confirms that they have collected
            and received their order. This usually happens within 24 to 48 hours of collection.
            You can track the status of every payment in your seller dashboard.
          </FaqItem>
          <FaqItem q="Can I sell in multiple church branches?">
            Yes. You can designate multiple church branch pickup points for your orders, allowing
            you to reach buyers across different branches in your city or region.
          </FaqItem>
          <FaqItem q="Are there any fees for selling?">
            Listing your first products is free. Church Potal charges a small commission on
            completed transactions to sustain the platform. Full fee details will be published
            before the platform opens to sellers. There are no hidden charges.
          </FaqItem>
          <FaqItem q="What happens if a buyer does not collect their order?">
            If a buyer fails to collect within the agreed window, you will be notified. Church
            Potal has a clear policy for uncollected orders that protects sellers. You will not be
            left out of pocket for a buyer's failure to collect.
          </FaqItem>
          <FaqItem q="Can I list digital products and services?">
            Yes. Church Potal supports listings for digital products such as e-books, templates,
            and digital art, as well as services such as graphic design, photography, catering,
            tutoring, and professional consulting.
          </FaqItem>
        </FaqGroup>

        <FaqGroup title="Trust and safety">
          <FaqItem q="How does Church Potal handle fraud?">
            Church membership verification significantly reduces fraud because every member is
            accountable to a real congregation. In addition, payments are held securely until
            buyers confirm receipt. Our team reviews all disputes and takes action against any
            member found to be acting in bad faith.
          </FaqItem>
          <FaqItem q="What if a seller misrepresents their product?">
            Buyers can raise a dispute before confirming collection. If the product does not match
            its listing description, the buyer is protected and a refund process will be
            initiated. Sellers found to consistently misrepresent their products will be removed
            from the platform.
          </FaqItem>
          <FaqItem q="Is my personal and payment information secure?">
            Yes. Church Potal uses industry-standard encryption for all personal data. Payment
            information is handled by our payment processor and never stored on our servers. We do
            not sell or share your data with third parties.
          </FaqItem>
          <FaqItem q="Can I report a seller or buyer?">
            Yes. Every member profile has a report option. Reports are reviewed by our team within
            48 hours. Serious violations result in immediate suspension pending investigation.
          </FaqItem>
        </FaqGroup>

        <FaqGroup title="Church branches">
          <FaqItem q="How does a church branch register as a pickup point?">
            A church admin or appointed coordinator can register their branch directly on Church
            Potal. Registration is free. We will verify the branch details and set up the pickup
            schedule before the branch goes live on the platform.
          </FaqItem>
          <FaqItem q="Does the church earn anything from being a pickup point?">
            We are developing a church partnership programme that will benefit registered
            branches. Details will be announced before the platform launches to the public. Any
            church that registers early will be considered a founding partner.
          </FaqItem>
          <FaqItem q="What is the responsibility of a church branch admin?">
            A registered branch admin is responsible for receiving seller deliveries, storing
            orders safely, notifying buyers, and managing the collection process. Church Potal
            provides the admin with a simple dashboard to manage all branch activity.
          </FaqItem>
        </FaqGroup>
      </div>
    </section>
  );
}

function FaqGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h3 className="text-label text-[color:var(--cp-gold)]">{title}</h3>
      <div className="mt-3 overflow-hidden rounded-xl border border-[color:var(--cp-rule)] bg-white">
        {children}
      </div>
    </section>
  );
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-[color:var(--cp-rule)] last:border-b-0">
      <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-editorial text-base font-bold text-[color:var(--cp-cocoa-deep)] hover:bg-[color:var(--cp-cream)]">
        <span>{q}</span>
        <span
          aria-hidden="true"
          className="text-[color:var(--cp-gold)] transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="px-5 pb-5 font-editorial text-body-sm leading-relaxed text-[color:var(--cp-cocoa-deep)]">
        {children}
      </div>
    </details>
  );
}

/* ─── SECTION 10 ── FINAL CTA ───────────────────────────────────────────── */
function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-[color:var(--cp-cocoa-deep)] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
        style={{ background: "var(--cp-cocoa-mid)", opacity: 0.2 }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full"
        style={{ background: "var(--cp-cocoa-mid)", opacity: 0.15 }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-20 text-center">
        <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          The Kingdom Is Open for Business.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl font-editorial text-lg italic leading-relaxed text-white/80">
          Join Church Potal today and be part of the first marketplace built entirely inside the
          body of Christ.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <CtaBlock
            kicker="For Church Members"
            title="Join as a Member"
            body="Shop from verified kingdom sellers. Collect at your church branch. Support the body of Christ."
            href="/register?role=BUYER"
            buttonLabel="Join as a Member"
          />
          <CtaBlock
            kicker="For Kingdom Sellers"
            title="Start Selling Today"
            body="List your products. Reach thousands of kingdom buyers. Build your business on trust."
            href="/register?role=SELLER"
            buttonLabel="Start Selling Today"
          />
        </div>

        <p className="mt-12 font-editorial text-lg italic text-[color:var(--cp-gold)]">
          Church Potal. Buy. Sell. Serve. Within the Kingdom.
        </p>
      </div>
    </section>
  );
}

function CtaBlock({
  kicker,
  title,
  body,
  href,
  buttonLabel,
}: {
  kicker: string;
  title: string;
  body: string;
  href: string;
  buttonLabel: string;
}) {
  return (
    <div
      className="card-dark text-left"
      style={{ borderColor: "rgba(219,164,74,0.3)" }}
    >
      <p className="text-tag text-[color:var(--cp-gold)]">{kicker}</p>
      <p className="mt-2 font-editorial text-2xl font-bold text-white">{title}</p>
      <p className="mt-2 text-body-sm leading-relaxed text-white/75">{body}</p>
      <div className="mt-5">
        <LinkButton href={href}>{buttonLabel}</LinkButton>
      </div>
    </div>
  );
}

/* ─── SECTION 11 ── FOOTER ──────────────────────────────────────────────── */
function Footer() {
  const links = [
    { label: "About Church Potal", href: "#about" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Become a Seller", href: "/register?role=SELLER" },
    { label: "Register Your Church Branch", href: "/register?role=CHURCH_ADMIN" },
    { label: "Help Centre", href: "#help" },
    { label: "Contact Us", href: "#contact" },
    { label: "Privacy Policy", href: "#privacy" },
    { label: "Terms of Service", href: "#terms" },
  ];

  return (
    <footer className="border-t border-[color:var(--cp-rule)] bg-[color:var(--cp-cream)]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <DiamondMark size={32} variant="light" />
              <span className="font-display text-base font-bold text-[color:var(--cp-cocoa-deep)]">
                Church Potal
              </span>
            </div>
            <p className="mt-3 font-editorial text-base italic text-[color:var(--cp-cocoa-mid)]">
              Buy. Sell. Serve. Within the Kingdom.
            </p>
            <p className="mt-3 max-w-sm text-body-sm leading-relaxed text-[color:var(--cp-cocoa-mid)]">
              Church Potal is a kingdom marketplace built for Nigerian church members. We exist to
              keep wealth circulating inside the body of Christ.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-2 text-body-sm">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-[color:var(--cp-cocoa-mid)] hover:text-[color:var(--cp-gold)]"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div>
            <p className="text-label text-[color:var(--cp-cocoa-mid)]">Join the Kingdom</p>
            <p className="mt-2 text-body-sm leading-relaxed text-[color:var(--cp-cocoa-mid)]">
              Be one of the first members on the platform. Buyers and sellers welcome.
            </p>
            <div className="mt-4">
              <LinkButton href="/register" size="sm">
                Join the community
              </LinkButton>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="my-10 h-px w-full"
          style={{ background: "var(--cp-rule)" }}
        />

        <p className="text-tag text-[color:var(--cp-cocoa-mid)]">
          Church Potal is a technology platform. We are not a church, ministry, or religious
          organisation. All transactions are between members. Church Potal facilitates but does not
          guarantee transactions.
        </p>
        <p className="mt-3 text-tag text-[color:var(--cp-mid)]">
          2025 Church Potal. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* ─── shared building blocks ─────────────────────────────────────────────── */

type Feature = {
  title: string;
  body: string;
  icon: LucideIcon;
};

function SectionHeader({
  label,
  title,
  intro,
  variant = "light",
}: {
  label: string;
  title: string;
  intro: string;
  variant?: "light" | "dark";
}) {
  const labelColor =
    variant === "dark" ? "text-[color:var(--cp-gold)]" : "text-[color:var(--cp-cocoa-mid)]";
  const titleColor = variant === "dark" ? "text-white" : "text-[color:var(--cp-cocoa-deep)]";
  const introColor = variant === "dark" ? "text-white/85" : "text-[color:var(--cp-cocoa-mid)]";
  return (
    <div className="text-center">
      <p className={`text-label ${labelColor}`}>{label}</p>
      <h2 className={`text-h1 mt-2 ${titleColor}`}>{title}</h2>
      <p className={`mx-auto mt-3 max-w-2xl font-editorial text-base italic ${introColor}`}>
        {intro}
      </p>
    </div>
  );
}

function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {features.map((f) => (
        <Card key={f.title} className="h-full">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-[color:var(--cp-sand)] text-[color:var(--cp-cocoa-deep)]">
            <f.icon size={18} />
          </div>
          <p className="mt-3 font-editorial text-base font-bold text-[color:var(--cp-cocoa-deep)]">
            {f.title}
          </p>
          <p className="mt-1 text-body-sm leading-relaxed text-[color:var(--cp-cocoa-deep)]">
            {f.body}
          </p>
        </Card>
      ))}
    </div>
  );
}
