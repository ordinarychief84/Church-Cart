import { ChurchIcon, Package, ShieldCheck, Truck, Users } from "lucide-react";

export default function ChurchPickupPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <ChurchIcon className="mx-auto h-10 w-10 text-brand-700" />
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Church-powered pickup</h1>
        <p className="mt-2 text-base text-slate-600">
          Have your churchCart orders delivered to your local church branch — pick up after service or on a
          weekday that suits you.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Step
          icon={<Package />}
          title="1. Choose at checkout"
          body="Pick the church branch nearest to you. Filter by denomination, state, city or branch name."
        />
        <Step
          icon={<Truck />}
          title="2. We ship to your branch"
          body="The vendor sends the package using our logistics network straight to your church."
        />
        <Step
          icon={<Users />}
          title="3. Branch contacts you"
          body="Your church admin marks the package ready and reaches out when it has arrived."
        />
        <Step
          icon={<ShieldCheck />}
          title="4. Show your code"
          body="Show the 6-digit code or QR on your phone. The branch verifies and hands you the package."
        />
      </div>

      <div className="mt-10 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Why this matters</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Logistics in Nigeria can be unreliable, and many homes lack a clear delivery address. Churches are
          trusted, well-known landmarks. Picking up at your branch means lower delivery cost, no missed
          deliveries, and a friendly face checking your package in.
        </p>
      </div>
    </div>
  );
}

function Step({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-2 text-brand-700">{icon}</div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}
