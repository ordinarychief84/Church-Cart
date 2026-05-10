import Link from "next/link";
import { ShoppingCart, Search, User as UserIcon, LogIn } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/guards";
import { ROLE_HOME } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function TopNav() {
  const user = await getCurrentUser();
  let cartCount = 0;
  if (user?.role === "BUYER") {
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: true },
    });
    cartCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-brand-700 text-sm font-bold text-white">
              cC
            </span>
            <span className="text-lg font-semibold tracking-tight">churchCart</span>
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-slate-600 md:flex">
            <Link href="/marketplace" className="hover:text-slate-900">
              Marketplace
            </Link>
            <Link href="/church-pickup" className="hover:text-slate-900">
              Church pickup
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/marketplace"
            className="hidden items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 sm:inline-flex"
          >
            <Search size={16} /> Search products
          </Link>

          {user?.role === "BUYER" && (
            <Link
              href="/cart"
              className="relative inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-slate-100"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-700 px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/account"
                className="hidden rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 sm:inline-flex"
              >
                Account
              </Link>
              <Link
                href={ROLE_HOME[user.role]}
                className="inline-flex items-center gap-2 rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-800"
              >
                <UserIcon size={16} />
                <span className="hidden sm:inline">{user.fullName.split(" ")[0]}</span>
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-800"
            >
              <LogIn size={16} /> Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
