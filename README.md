# churchCart — Worship Mate Marketplace

A Christian community marketplace for Nigeria with **church-powered logistics**: buyers can have orders shipped to a chosen church branch (RCCG, Winners Chapel, Christ Embassy, Catholic Church, Anglican, Deeper Life, …) instead of paying for home delivery.

This repo is the production-ready MVP. Real Paystack, real logistics providers (Shipbubble / GIG / Kwik), and real notification channels (SMS, WhatsApp, email) are abstracted behind interfaces and wired in stub mode for now — they drop in later without touching domain code.

## Stack

- **Next.js 14** App Router · TypeScript · Tailwind CSS
- **Prisma 5** + PostgreSQL (local Docker for dev, Neon for prod)
- **Auth**: custom JWT (jose) in httpOnly cookie + bcrypt
- **Validation**: Zod on every server action and API handler
- **Mutations**: server actions (95%) + API routes for webhook, upload, polling
- **Storage**: Vercel Blob (`@vercel/blob`)
- **Money**: stored as `Int` kobo (NGN minor unit) — never floats

## Getting started

```bash
# 1. install deps
npm install

# 2. configure
cp .env.example .env
# fill in DATABASE_URL and a strong JWT_SECRET (32+ random bytes)
# Vercel Blob, Paystack, Resend can stay empty for MVP

# 3. start a Postgres instance, then:
npm run db:migrate -- --name init
npm run db:seed

# 4. dev
npm run dev
```

Open http://localhost:3000.

### Seeded credentials

All seeded users share the password **`Password123!`**.

| Role         | Email                              | What they can do            |
|--------------|------------------------------------|-----------------------------|
| Admin        | `admin@churchcart.test`            | Approve vendors / churches  |
| Vendor       | `vendor1@churchcart.test`          | Manage Glory Books NG       |
| Buyer        | `buyer1@churchcart.test`           | Order, checkout, track      |
| Church admin | `rccg-cod@churchcart.test`         | Verify pickup at RCCG       |

The seed creates 5 verified vendors, 6 approved church branches across Lagos / Abuja / Port Harcourt / Ibadan, 6 buyers, and 10 orders covering every state in the order lifecycle.

## Verification walkthrough (manual)

1. **Buyer · church pickup** — register → marketplace → add 2 products → checkout → choose Church Pickup → filter by RCCG / Lagos → pick "City of David Parish" → mock-pay → see pickup code + QR.
2. **Vendor** — login as vendor → click *Mark processing* on the new PAID order → click *Mark shipped*.
3. **Church admin** — login → see the package on incoming → *Mark arrived* → *Mark ready* → enter the buyer's 6-digit code on `/church/verify` → it transitions to PICKED_UP and a payout row is created.
4. **Failed pickup** — from READY_FOR_PICKUP, *Failed pickup* with a reason → status moves to FAILED_PICKUP, `PickupRecord.outcome=FAILED`.
5. **Home delivery** — same flow with Home Delivery; admin marks DELIVERED.
6. **Admin approval** — register a fresh vendor (status PENDING) → product create blocked until admin approves on `/admin/vendors`.

## Architecture highlights

- `src/lib/orders/stateMachine.ts` — pure transition function. The single source of truth for what a buyer/vendor/church admin can do at each status.
- `src/lib/orders/applyTransition.ts` — runs the state machine inside a Prisma transaction, writes audit row (`OrderStatusEvent`), emits notifications, creates payouts, restocks on cancel.
- `src/lib/payments/paystack.ts` — placeholder shaped exactly like real Paystack returns. Signature verifier ready for production.
- `src/lib/logistics/` — provider-agnostic interface. Add Shipbubble / GIG / Kwik by implementing `LogisticsProvider`.
- `src/lib/notifications/` — `emit()` writes a `NotificationEvent` row; channel adapters (email/sms/whatsapp) are no-ops in MVP.
- `src/lib/storage/vercelBlob.ts` — `uploadImage()`/`deleteImage()` server-only helpers.
- `src/middleware.ts` — JWT decode + role-prefix guard. Defense-in-depth role + ownership checks happen again in `lib/auth/guards.ts` and inside every server action.

## Money math

```
platformFeeKobo  = floor(subtotalKobo * PLATFORM_FEE_BPS / 10_000)   # 5% by default
vendorAmountKobo = subtotalKobo - platformFeeKobo
logisticsFeeKobo = quote from logistics provider
totalKobo        = subtotalKobo + logisticsFeeKobo
```

A multi-vendor cart creates **one Order per vendor** sharing one Payment. All amounts are integers in kobo.

## What's deliberately out of scope for MVP

- Real Paystack network calls (`/checkout/mock-payment` simulates success/failure)
- Real SMS / WhatsApp / email sending (channel adapters are no-ops; rows stay QUEUED)
- Real logistics integrations (Shipbubble, GIG, Kwik)
- Multi-role users, wishlists, promo codes, gift cards, vendor variants
- Real-time updates (use the polling endpoint at `GET /api/orders/[id]/status`)
- Internationalization (English-only, ₦-only)
- Accessibility audit beyond semantic HTML + visible focus rings

## Deploy notes

- Vercel project with `BLOB_READ_WRITE_TOKEN` from a Vercel Blob store
- Neon project; set `DATABASE_URL` to the pooled connection string
- `npm run build` runs `prisma generate` then `next build`. For Neon, also run `npm run db:deploy` once on first deploy (or add it to the build script for automatic migrations on push).
