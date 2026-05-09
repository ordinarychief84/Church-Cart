import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { RoleSidebar, type SidebarItem } from "@/components/layout/RoleSidebar";

export const dynamic = "force-dynamic";

const items: SidebarItem[] = [
  { href: "/admin/dashboard", label: "Overview", icon: "LayoutDashboard" },
  { href: "/admin/vendors", label: "Vendors", icon: "Store" },
  { href: "/admin/churches", label: "Churches", icon: "ChurchIcon" },
  { href: "/admin/products", label: "Products", icon: "Boxes" },
  { href: "/admin/orders", label: "Orders", icon: "ListOrdered" },
  { href: "/admin/disputes", label: "Disputes", icon: "AlertTriangle" },
  { href: "/admin/categories", label: "Categories", icon: "Tags" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <div className="flex flex-1">
        <RoleSidebar items={items} title="Admin" />
        <main className="flex-1">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
