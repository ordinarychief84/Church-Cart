import Link from "next/link";
import { Users } from "lucide-react";
import type { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { formatDate, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";

const ROLE_FILTERS: { label: string; value: Role | null; tone: "neutral" | "info" | "success" | "gold" | "warning" }[] = [
  { label: "All", value: null, tone: "neutral" },
  { label: "Buyers", value: "BUYER", tone: "info" },
  { label: "Vendors", value: "VENDOR", tone: "gold" },
  { label: "Church admins", value: "CHURCH_ADMIN", tone: "success" },
  { label: "Admins", value: "ADMIN", tone: "warning" },
];

const ROLE_TONE: Record<Role, "info" | "gold" | "success" | "warning"> = {
  BUYER: "info",
  VENDOR: "gold",
  CHURCH_ADMIN: "success",
  ADMIN: "warning",
};

const ROLE_LABEL: Record<Role, string> = {
  BUYER: "Buyer",
  VENDOR: "Vendor",
  CHURCH_ADMIN: "Church admin",
  ADMIN: "Admin",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role?: string; q?: string };
}) {
  await requireAdmin();
  const ROLES = ["BUYER", "VENDOR", "CHURCH_ADMIN", "ADMIN"] as const satisfies readonly Role[];
  const role: Role | null =
    searchParams.role && (ROLES as readonly string[]).includes(searchParams.role)
      ? (searchParams.role as Role)
      : null;
  const q = (searchParams.q ?? "").trim();

  const [counts, users] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(q
          ? {
              OR: [
                { fullName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        vendorProfile: { select: { businessName: true, status: true } },
        churchBranch: { select: { branchName: true, churchName: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const totals = Object.fromEntries(counts.map((c) => [c.role, c._count._all]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="Users" description={`${users.length} shown · 200 max per filter`} />

      {/* KPI cards by role */}
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {(["BUYER", "VENDOR", "CHURCH_ADMIN", "ADMIN"] as const).map((r) => (
          <Card key={r}>
            <CardBody className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-brand-50 text-brand-700">
                <Users size={16} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{ROLE_LABEL[r]}s</p>
                <p className="text-lg font-semibold">{totals[r] ?? 0}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Filter chips + search */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {ROLE_FILTERS.map((f) => {
            const active = (f.value ?? null) === role;
            const href = f.value ? `/admin/users?role=${f.value}` : "/admin/users";
            return (
              <Link
                key={f.label}
                href={href + (q ? `${f.value ? "&" : "?"}q=${encodeURIComponent(q)}` : "")}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  active
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <form method="get" action="/admin/users" className="flex gap-2">
          {role && <input type="hidden" name="role" value={role} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name / email / phone"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
          <button
            type="submit"
            className="rounded-md bg-brand-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-800"
          >
            Search
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Profile</th>
              <th className="px-4 py-2">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                  No users match this filter.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{u.fullName}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {u.email && <span className="block">{u.email}</span>}
                    {u.phone && <span className="block text-xs text-slate-500">{formatPhone(u.phone)}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {u.role === "VENDOR" && u.vendorProfile && (
                      <Link href="/admin/vendors" className="hover:underline">
                        {u.vendorProfile.businessName}{" "}
                        <span className="text-slate-400">({u.vendorProfile.status.toLowerCase()})</span>
                      </Link>
                    )}
                    {u.role === "CHURCH_ADMIN" && u.churchBranch && (
                      <Link href="/admin/churches" className="hover:underline">
                        {u.churchBranch.churchName} — {u.churchBranch.branchName}{" "}
                        <span className="text-slate-400">({u.churchBranch.status.toLowerCase()})</span>
                      </Link>
                    )}
                    {u.role === "BUYER" && <span className="text-slate-400">—</span>}
                    {u.role === "ADMIN" && <span className="text-slate-400">Platform</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
