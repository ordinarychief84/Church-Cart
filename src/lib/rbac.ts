import { Role } from "@prisma/client";

export const ROLE_HOME: Record<Role, string> = {
  BUYER: "/dashboard",
  VENDOR: "/vendor/dashboard",
  CHURCH_ADMIN: "/church/dashboard",
  ADMIN: "/admin/dashboard",
};

const PROTECTED_PREFIXES: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/vendor", roles: ["VENDOR"] },
  { prefix: "/church", roles: ["CHURCH_ADMIN"] },
  { prefix: "/dashboard", roles: ["BUYER"] },
  { prefix: "/cart", roles: ["BUYER"] },
  { prefix: "/checkout", roles: ["BUYER"] },
  { prefix: "/orders", roles: ["BUYER"] },
];

export function requiredRolesForPath(pathname: string): Role[] | null {
  for (const entry of PROTECTED_PREFIXES) {
    if (pathname === entry.prefix || pathname.startsWith(entry.prefix + "/")) {
      return entry.roles;
    }
  }
  return null;
}
