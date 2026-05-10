"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  ListOrdered,
  Settings,
  Package,
  ScanLine,
  History,
  Store,
  ChurchIcon,
  AlertTriangle,
  Tags,
  Wallet,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  LayoutDashboard,
  Boxes,
  ListOrdered,
  Settings,
  Package,
  ScanLine,
  History,
  Store,
  ChurchIcon,
  AlertTriangle,
  Tags,
  Wallet,
  Users,
} as const;

export type SidebarIconKey = keyof typeof ICONS;

export type SidebarItem = {
  href: string;
  label: string;
  icon: SidebarIconKey;
};

export function RoleSidebar({ items, title }: { items: SidebarItem[]; title: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      </div>
      <nav className="flex flex-col p-2 text-sm">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100",
                active && "bg-brand-50 font-medium text-brand-800"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
