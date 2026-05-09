import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { RoleSidebar, type SidebarItem } from "@/components/layout/RoleSidebar";

export const dynamic = "force-dynamic";

const items: SidebarItem[] = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/vendor/products", label: "Products", icon: "Boxes" },
  { href: "/vendor/orders", label: "Orders", icon: "ListOrdered" },
  { href: "/vendor/settings", label: "Store settings", icon: "Settings" },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <div className="flex flex-1">
        <RoleSidebar items={items} title="Vendor" />
        <main className="flex-1">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
