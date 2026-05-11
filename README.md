# Church Potal — Kingdom Marketplace

> Buy. Sell. Serve. Within the Kingdom.

A faith-anchored, community-driven marketplace for Nigerian church members.
Members buy and sell with believers across the country and pick up orders
at a trusted church branch. Every seller is Kingdom Verified. Every
transaction is held in escrow until pickup.

Built on **Next.js 14 + TypeScript + Tailwind + Supabase**.

---

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS 3 + custom design system (see `src/app/globals.css`) |
| Database | Supabase Postgres, custom `justhazaar` schema |
| Auth | Supabase Auth — email + Google OAuth |
| Realtime | Supabase Realtime on `orders` + `notifications` |
| Payments | Paystack (mocked end-to-end; real swap is one server-action change) |
| Fonts | Outfit · Lora · DM Sans · IBM Plex Mono |
| Money | All amounts stored as `Int` kobo |

---

## Roles

| Role | Public sign-up? | What they can do |
|---|---|---|
| `BUYER` | yes (default) | Browse, place pickup orders, collect at their home church |
| `SELLER` | yes | List digital + physical products, fulfil orders, get paid via Paystack |
| `CHURCH_ADMIN` | yes | Register a branch as a pickup point, run the daily pickup manifest |
| `PLATFORM_ADMIN` | **no** (seeded only) | Approve sellers / branches, full RLS bypass |

Self-promotion to `PLATFORM_ADMIN` via the sign-up form is rejected by the
`handle_new_user` Postgres trigger.

---

## What's built

### Auth & onboarding
- Email + password sign-up / sign-in
- Google OAuth via `/auth/callback`
- First-time OAuth users land on `/onboarding` to choose a role
- `complete_onboarding(p_role)` SECURITY DEFINER RPC enforces one-time role selection
- `requireRole()` auto-redirects un-onboarded users to `/onboarding`

### Catalog
- Categories seeded (Christian books, fashion, food, gifts, church supplies, event products, digital products…)
- Physical products with stock + weight + multi-branch pickup
- Digital products (course / ebook / template) with Paystack payment link
- Public marketplace at `/marketplace` filtered by denomination + state
- Product detail at `/p/[slug]`

### Order flow
- Buyer picks pickup branch → places order → simulated Paystack
- Seller transitions PAID → PROCESSING → SHIPPED (RLS-gated)
- Church admin transitions SHIPPED → ARRIVED → READY → PICKED_UP (RLS-gated)
- Postgres trigger fans out notifications to buyer + seller + branch admin on every status change
- Supabase Realtime refreshes the buyer order page on UPDATE
- Daily pickup manifest with print-friendly layout

### Notifications
- `justhazaar.notifications` table with RLS
- In-app bell with Realtime INSERT subscription
- One-tap "mark all read"

### Brand system (Church Potal — Kingdom Marketplace)
- Cocoa + Gold palette as Tailwind tokens + CSS custom properties
- SVG diamond logo (church + arch + cross + location pin)
- `@layer components` library in `src/app/globals.css`: buttons, cards, badges, inputs, status pills, type scale
- React primitives in `src/components/ui/`: `Button`, `LinkButton`, `Card`, `Input`, `StatusPill`, `OrderStatusPill`, `Badge`
- `AuthShell` split-screen for login / register / onboarding

---

## Database (schema `justhazaar`, all RLS-enabled)

- `profiles` — 1:1 with `auth.users`; role + name + phone + home branch + `onboarded_at`
- `sellers` — extra fields for `SELLER` users + verification status
- `church_branches` — branch details + approval status + pickup hours/days/capacity
- `product_categories` — 8 seeded
- `products` — digital + physical
- `product_pickup_locations` — many-to-many physical product → branch
- `orders` + `order_items` — full lifecycle with `paid_at` / `picked_up_at`
- `notifications` — per-recipient inbox + Realtime publication

Triggers: `handle_new_user`, `on_order_inserted`, `on_order_status_changed`.

---

## Getting started

```bash
cp .env.example .env.local        # fill in your Supabase URL + anon key
npm install
npm run dev
```

The dev server reads `NEXT_PUBLIC_SUPABASE_*` from `.env.local`.

To enable Google sign-in:

1. In the Supabase dashboard → Authentication → Providers → Google, paste your Google `client_id` + `secret`.
2. Add `https://<your-domain>/auth/callback` and `http://localhost:3000/auth/callback` to the **Authorized redirect URIs** in the Google Cloud OAuth client.

---

## Verifying the build

```bash
npm run check     # typecheck + lint
npm run build     # production build
```

Both should pass clean. 19 routes generate.

---

## What's next

- **Trust-anchored onboarding** — multi-step wizard with home-church anchor, ministry/tenure, witness (member or pastor), Kingdom Covenant signing, community snapshot. Schema additions sketched; ready to build.
- Admin approval queues + dispute resolution UI
- Real Paystack integration (swap the simulated reference + add the webhook handler)
- Seed script with sample sellers / branches / products
- Pickup verification with 6-digit code + QR
