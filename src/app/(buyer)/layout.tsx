import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

export const dynamic = "force-dynamic";

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="flex-1 bg-slate-50">{children}</main>
      <Footer />
    </div>
  );
}
