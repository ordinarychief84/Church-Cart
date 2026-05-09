import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { RoleSidebar, type SidebarItem } from "@/components/layout/RoleSidebar";

export const dynamic = "force-dynamic";

const items: SidebarItem[] = [
  { href: "/church/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/church/packages", label: "Incoming packages", icon: "Package" },
  { href: "/church/verify", label: "Verify pickup", icon: "ScanLine" },
  { href: "/church/history", label: "Pickup history", icon: "History" },
  { href: "/church/settings", label: "Branch settings", icon: "Settings" },
];

export default function ChurchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <div className="flex flex-1">
        <RoleSidebar items={items} title="Church admin" />
        <main className="flex-1">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
