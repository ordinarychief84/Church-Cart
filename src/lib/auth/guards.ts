import { redirect } from "next/navigation";
import { Role, VendorStatus, ChurchStatus } from "@prisma/client";
import type { User, VendorProfile, ChurchBranch } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/auth/session";

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await readSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: Role | Role[]): Promise<User> {
  const user = await requireUser();
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(user.role)) {
    throw new ForbiddenError(`Required role: ${allowed.join(", ")}`);
  }
  return user;
}

export async function requireVerifiedVendor(): Promise<{ user: User; vendor: VendorProfile }> {
  const user = await requireRole("VENDOR");
  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
  if (!vendor) throw new ForbiddenError("Vendor profile not found");
  if (vendor.status !== VendorStatus.VERIFIED) {
    throw new ForbiddenError("Vendor not yet verified");
  }
  return { user, vendor };
}

export async function requireApprovedChurchAdmin(): Promise<{
  user: User;
  church: ChurchBranch;
}> {
  const user = await requireRole("CHURCH_ADMIN");
  const church = await prisma.churchBranch.findUnique({ where: { adminUserId: user.id } });
  if (!church) throw new ForbiddenError("Church branch not found");
  if (church.status !== ChurchStatus.APPROVED) {
    throw new ForbiddenError("Church branch not yet approved");
  }
  return { user, church };
}

export async function requireAdmin(): Promise<User> {
  return requireRole("ADMIN");
}
