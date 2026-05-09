/**
 * Prisma `select` shape that exposes only the User fields safe to render or
 * pass through React Server Component payloads. NEVER include `passwordHash`
 * via `include: { user: true }` style — that field gets serialised into the
 * RSC stream and is visible to anyone viewing the page source.
 */
export const safeUserSelect = {
  id: true,
  email: true,
  phone: true,
  fullName: true,
  role: true,
  createdAt: true,
} as const;
