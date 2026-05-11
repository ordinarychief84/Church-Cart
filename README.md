# JustHazaar — WorshipMate Marketplace

Christian marketplace for Nigeria, with church-powered pickup. Built on Next.js 14 + Supabase.

## What's in this scaffold

This is the foundation the spec asked for:

- **Next.js 14 App Router** + TypeScript + Tailwind + ESLint with security headers
- **Supabase Auth** (`@supabase/ssr`) for all sign-up / sign-in / session refresh
- **4-role data model** in a dedicated `justhazaar` Postgres schema with RLS turned on for every table
- **Auto-provisioned profiles** — a Postgres trigger creates a `justhazaar.profiles` row whenever someone signs up via Supabase Auth
- **Role-aware routing** — `/buyer`, `/seller`, `/church`, `/admin` are all gated by `requireRole`
- Marketing home, sign-up (with role selector), sign-in, sign-out

## Roles

| Role | Public sign-up? | What they can do |
|---|---|---|
| `BUYER` | yes (default) | Browse + buy + pick up at a church branch |
| `SELLER` | yes | List products, manage orders (after platform admin verifies) |
| `CHURCH_ADMIN` | yes | Host pickups at a branch (after platform admin approves) |
| `PLATFORM_ADMIN` | **no** (seeded only) | Approve sellers / churches, full RLS bypass |

Self-promotion to `PLATFORM_ADMIN` via the sign-up form is rejected by the `handle_new_user` trigger.

## Tables (all in schema `justhazaar`, all RLS-enabled)

- `profiles` — 1:1 with `auth.users`, holds role + name + phone
- `sellers` — extra fields for users with role `SELLER`
- `church_branches` — extra fields for users with role `CHURCH_ADMIN`
- `product_categories` — seeded with 8 categories
- `products`
- `orders`, `order_items`

See the two Supabase migrations for the full schema + policies.

## Getting started

```bash
cp .env.example .env.local   # already filled in with the dev project's keys
npm install
npm run dev
```

The dev server reads `NEXT_PUBLIC_SUPABASE_*` from `.env.local` and connects to your Supabase project.

## RLS at a glance

- **profiles** — you can read your own row + anything if you're a platform admin; `role` is locked against client updates
- **sellers** — public can read verified sellers; owners can edit theirs (status stays admin-controlled)
- **church_branches** — same pattern, admin = `CHURCH_ADMIN` user
- **products** — public can read available products from verified sellers; sellers can CRUD their own
- **orders** — buyer sees own; seller sees own; church admin sees orders going to their branch; admin sees everything

Order *creation* is intentionally not exposed to the client; it goes through a server action with the service-role key once checkout is built.

## Next steps (deliberately out of this scaffold)

- Seller / church profile setup forms
- Product CRUD + Supabase Storage uploads
- Cart + checkout flow
- Paystack escrow integration
- Pickup verification UI (6-digit code + QR)
- Realtime order status pushes
- Admin approval queues + dispute resolution
- Seed script: sample sellers + branches + products

The role gates, RLS policies, and auth wiring are all in place — adding the above layers on top will not require auth or schema changes.
