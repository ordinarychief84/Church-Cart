"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Package,
  Settings,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import type { SellerStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/seller", label: "Dashboard", icon: LayoutDashboard },
  { href: "/seller/products", label: "Products", icon: Boxes },
  { href: "/seller/orders", label: "Orders", icon: Package },
  { href: "/seller/settings", label: "Store settings", icon: Settings },
];

export function SellerSidebar({
  businessName,
  status,
  slug,
}: {
  businessName: string;
  status: SellerStatus | null;
  slug: string | null;
}) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="card !p-4">
        <p className="text-label text-[color:var(--cp-cocoa-mid)]">Seller</p>
        <p className="mt-1 truncate font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
          {businessName}
        </p>
        {status === "VERIFIED" && (
          <span className="badge-verified mt-2 inline-flex">
            <ShieldCheck size={10} /> Kingdom Verified
          </span>
        )}
        {status === "PENDING" && (
          <span
            className="mt-2 inline-flex items-center gap-1 rounded font-ui font-medium uppercase"
            style={{
              background: "rgba(219,164,74,0.2)",
              color: "var(--cp-cocoa-mid)",
              fontSize: "10px",
              letterSpacing: "0.08em",
              padding: "3px 8px",
            }}
          >
            <ShieldAlert size={10} /> Pending review
          </span>
        )}
        {status === "REJECTED" && (
          <span
            className="mt-2 inline-flex items-center gap-1 rounded font-ui font-medium uppercase"
            style={{
              background: "#FEEFE9",
              color: "#842029",
              fontSize: "10px",
              letterSpacing: "0.08em",
              padding: "3px 8px",
            }}
          >
            Not approved
          </span>
        )}
        {!status && (
          <span
            className="mt-2 inline-flex items-center gap-1 rounded font-ui font-medium uppercase"
            style={{
              background: "var(--cp-sand)",
              color: "var(--cp-mid)",
              fontSize: "10px",
              letterSpacing: "0.08em",
              padding: "3px 8px",
            }}
          >
            No profile yet
          </span>
        )}
      </div>

      <nav className="mt-3 flex flex-col rounded-xl border border-[color:var(--cp-rule)] bg-white p-2 font-ui text-body-sm">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-[color:var(--cp-cocoa-mid)] transition-colors hover:bg-[color:var(--cp-cream)] hover:text-[color:var(--cp-cocoa-deep)]",
                active &&
                  "bg-[color:var(--cp-sand)]/40 font-medium text-[color:var(--cp-cocoa-deep)]"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
        {slug && status === "VERIFIED" && (
          <Link
            href={`/s/${slug}`}
            className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-[color:var(--cp-cocoa-mid)] transition-colors hover:bg-[color:var(--cp-cream)] hover:text-[color:var(--cp-cocoa-deep)]"
          >
            <ExternalLink size={16} />
            View public store
          </Link>
        )}
      </nav>
    </aside>
  );
}
