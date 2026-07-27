# PochtaShop

**Chet eldan xavfsiz xarid qilish bo'yicha shaxsiy yordamchi.**

Telegram Mini App for people in Uzbekistan buying from Chinese, US and Turkish
online stores. It teaches how to order, finds the product, compares couriers,
explains the customs risk, and helps talk to the seller.

The core flow: **O'rgatadi → Topadi → Solishtiradi → Xavfni tushuntiradi → Yordam beradi.**

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Running locally](#running-locally)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [Database migrations](#database-migrations)
- [Seed data](#seed-data)
- [Telegram bot setup](#telegram-bot-setup)
- [AI provider setup](#ai-provider-setup)
- [Tests](#tests)
- [Deployment](#deployment)
- [Creating an admin](#creating-an-admin)
- [Granting the courier role](#granting-the-courier-role)
- [Architecture notes](#architecture-notes)
- [Security](#security)

---

## Features

**For buyers**

- Universal search: product name, photo, screenshot or a store link
- Three AI recommendations — **eng arzon**, **eng tez**, **eng ishonchli** — with
  full cost breakdown, delivery window and customs risk
- Side-by-side comparison of recommendations and of up to three couriers
- Store catalogue (12 demo platforms across CN / US / TR) with buyer protection,
  returns and authenticity information
- Product detail with seller trust signals and a category-aware
  **compatibility check** (size systems, voltage, plug, battery, expiry …)
- Volumetric weight calculator and shipping quotes per courier tariff
- Customs cost calculator with an explanation, legal source and update date
- Customs risk module: **yashil / sariq / qizil**, with reasons, a checklist,
  possible documents and next steps
- Commercial-intent scoring and a "Nima uchun boj chiqdi?" explainer
- Interactive lessons for Pinduoduo, Taobao, Amazon and Trendyol with a neutral
  training simulator that explains mistakes and lets you retry
- Seller assistant: ten ready questions in Chinese, English and Turkish, plus
  reply translation with risk warnings
- Saved items, history, paid consultations and an "order for me" service

**For operators**

- Admin panel (20 sections): dashboard, users, catalogue, tariffs, customs
  rules, restricted goods, courses, promotions, reviews, consultations, orders,
  premium, ads, AI logs, settings and an audit log
- Courier cabinet where a courier representative proposes changes that are
  published only after an administrator approves them

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript, `strict` + `noUncheckedIndexedAccess` |
| Styling | Tailwind CSS with design tokens, Framer Motion, Lucide icons |
| Backend | Next.js Route Handlers |
| Database | Supabase (PostgreSQL) — optional; a demo data source is built in |
| Auth | Telegram `initData` (HMAC-verified server-side); Supabase Auth for admin |
| AI | Provider abstraction: `mock` (default), `anthropic`, `openai` |
| Tests | Vitest (unit + integration), Playwright (E2E) |

---

## Running locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. No configuration file is required.

Out of the box the app runs **without Supabase, without an AI key and without a
Telegram bot token**: it uses
the bundled demo catalogue and the deterministic mock AI provider, so every
screen and every calculation works in a normal browser.

Telegram `initData` cannot be verified without a bot token, so while
`TELEGRAM_BOT_TOKEN` is empty a demo identity is used outside production. As
soon as you set a token, real signature verification applies. Production is
protected by the environment validator: it refuses to boot without a token, and
refuses `ALLOW_INSECURE_TELEGRAM_AUTH=true` outright.

Copy `.env.example` to `.env.local` only when you start wiring Supabase, a real
AI provider or the bot.

Scripts:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (unit + integration) |
| `npm run test:e2e` | Playwright end-to-end suite |
| `npm run seed` | Load demo data into Supabase |

---

## Environment variables

See [`.env.example`](.env.example). Summary:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | yes | Public HTTPS URL; used for the Mini App button |
| `APP_ENV` | yes | `development` / `test` / `staging` / `production` |
| `NEXT_PUBLIC_SUPABASE_URL` | no | Empty ⇒ demo data source |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | Empty ⇒ demo data source |
| `SUPABASE_SERVICE_ROLE_KEY` | prod | Server only — never exposed to the client |
| `TELEGRAM_BOT_TOKEN` | prod | `initData` signatures are verified against it |
| `TELEGRAM_WEBHOOK_SECRET` | prod | Shared secret for the bot webhook |
| `ALLOW_INSECURE_TELEGRAM_AUTH` | no | Dev only; must be `false` in production |
| `AI_PROVIDER` | yes | `mock` \| `anthropic` \| `openai` |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | when used | Server only |
| `FILE_DELETE_AFTER_ANALYSIS` | yes | Keep `true`: uploads are deleted after analysis |
| `SUPABASE_UPLOAD_BUCKET` | no | Storage bucket for transient uploads |
| `ADMIN_EMAIL` | no | Bootstrap admin address |

The environment is validated at startup (`src/lib/env.ts`). In production the app
refuses to boot without `TELEGRAM_BOT_TOKEN`, or with insecure auth enabled.

---

## Supabase setup

1. Create a project at <https://supabase.com>.
2. Copy the project URL, `anon` key and `service_role` key into `.env.local`.
3. Create a **private** storage bucket named `uploads` (or set
   `SUPABASE_UPLOAD_BUCKET`). It only ever holds files for the duration of one
   AI analysis.
4. Run the migrations below, then the seed script.

---

## Database migrations

SQL lives in [`supabase/migrations`](supabase/migrations):

- `0001_init.sql` — all tables (users, catalogue, couriers, customs, learning,
  AI, consultations, subscriptions, reviews, admin), each with a UUID primary
  key, `created_at`, `updated_at` and `deleted_at` where soft deletion applies.
- `0002_rls.sql` — Row Level Security: the anon/authenticated roles get
  read-only access to the public catalogue and to published reviews; everything
  else is reachable only through the server, which uses the service-role key
  after verifying Telegram `initData`.

Apply them with the Supabase CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Or paste each file into the SQL editor in the Supabase dashboard, in order.

---

## Seed data

```bash
npm run seed
```

Loads 12 demo stores, 10 demo couriers with tariffs, 6 products with offers and
sellers, 4 learning platforms with 10-step courses, customs rules, restricted
and prohibited goods, promotions and subscription plans.

Every record is flagged **Demo** and upserted by a stable external id, so the
script is safe to run repeatedly. Courier names are deliberately neutral
(Fast Cargo, Orient Express, Global Parcel, Silk Road Cargo, ExpressBox …) — no
real organisation's tariffs are reproduced.

---

## Telegram bot setup

1. Create a bot with [@BotFather](https://t.me/BotFather) and copy the token
   into `TELEGRAM_BOT_TOKEN`.
2. Set the Mini App URL: `/setmenubutton` → your bot → your HTTPS URL, or via
   `/newapp`.
3. Register the webhook, with a secret you also put in
   `TELEGRAM_WEBHOOK_SECRET`:

   ```bash
   curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -d "url=https://<your-domain>/api/telegram/webhook" \
     -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
   ```

4. Commands handled: `/start`, `/app`, `/help`, `/consultation`. `/app` sends a
   button that opens the Mini App.

The Mini App itself only trusts `initData` verified on the server
(`src/lib/telegram/init-data.ts`): the data-check-string is rebuilt, HMAC-SHA256
signed with `HMAC("WebAppData", botToken)` and compared in constant time, and
payloads older than 24 hours are rejected.

---

## AI provider setup

`AI_PROVIDER` selects the implementation of the `AIProvider` interface
(`src/types/ai.ts`):

- `mock` — deterministic, no API key, used by default and in tests
- `anthropic` — set `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`)
- `openai` — set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`)

The rule engines stay authoritative for money and risk. The hosted provider is
asked to *narrate* the computed result, and if it returns malformed output the
deterministic result is used instead. Untrusted text is stripped of
instruction-override patterns and wrapped in an explicit data envelope before it
reaches a model (`src/lib/ai/prompt-guard.ts`).

Adding a provider means implementing `AIProvider` and registering it in
`src/lib/ai/index.ts`. No call site changes.

---

## Tests

```bash
npm test          # 91 unit + integration tests
npm run test:e2e  # 14 Playwright scenarios
```

**Unit** — customs calculator, volumetric weight, shipping quotes, risk scoring,
commercial intent, duty explanation, Zod validation, file-upload gate, rate
limiting, prompt-injection guard, currency formatting, Telegram `initData`
verification (including tampering, replay and wrong-token cases).

**Integration** — the real route handlers against the in-memory data source:
search, saved items, consultations, admin actions and audit logging, assisted
orders, review moderation, customs endpoints, learning progress, health.

**E2E** — the acceptance scenarios: open the app, search, get three
recommendations, compare couriers, compute volumetric weight, run the customs
calculator, check the customs risk, complete a lesson step with a wrong answer
and a retry, draft a seller message, submit a consultation and see it in the
admin panel, save and remove an item, and submit a courier change for approval.

If your environment ships a pre-installed Chromium at a different revision, set
`PLAYWRIGHT_CHROMIUM_PATH` to its binary.

---

## Deployment

### GitHub Pages (live demo)

`.github/workflows/pages.yml` builds a fully static export on every push to
`main` and publishes it to GitHub Pages. Enable it once under
**Settings → Pages → Source → GitHub Actions**.

There is no server in that build, so `scripts/prepare-static.mjs` parks the API
routes and switches the route segments to `force-static`, and `apiFetch` is
redirected to an in-browser shim
(`src/lib/static-demo/local-api.ts`). The shim calls the *same* rule engines and
the same in-memory data source the server uses, so recommendations, customs
figures and risk levels are identical to a real deployment. Each visitor's saved
items, history and requests live in their own `localStorage`.

Two features need a server and are unavailable there: the screenshot assistant
(it says so plainly) and any Supabase-backed shared storage.

The script is exactly reversible — `node scripts/prepare-static.mjs --restore`
returns the tree to server mode.

### Vercel + Supabase (full app)

1. Import the repository into Vercel.
2. Add the production environment variables (`APP_ENV=production`,
   `NEXT_PUBLIC_APP_URL`, Supabase keys, `TELEGRAM_BOT_TOKEN`,
   `TELEGRAM_WEBHOOK_SECRET`, AI keys). Never set
   `ALLOW_INSECURE_TELEGRAM_AUTH=true` in production — the app refuses to boot.
3. Deploy, then run migrations and `npm run seed` against the production project.
4. Point BotFather's Mini App URL and the webhook at the deployed HTTPS domain.
5. Verify `GET /api/health`:

   ```json
   {
     "status": "ok",
     "database": "connected",
     "ai": "configured",
     "telegram": "configured",
     "timestamp": "2026-07-27T12:00:00.000Z"
   }
   ```

   `database` is `demo` when Supabase is not configured and `error` when it is
   configured but unreachable; `status` becomes `degraded` in that case.

Telegram requires HTTPS — Vercel provides it automatically.

---

## Creating an admin

In demo mode the first user to open the app becomes an admin, so the panel is
reachable immediately.

With Supabase:

```sql
update users set role = 'admin' where telegram_id = <telegram_id>;

-- For Supabase Auth access to admin tables:
insert into admin_users (email, auth_user_id, role)
values ('admin@example.com', '<auth-user-uuid>', 'admin');
```

Find your `telegram_id` in the admin **Foydalanuvchilar** section, or from the
bot.

---

## Granting the courier role

```sql
update users
set role = 'courier', courier_id = 'courier_fast_cargo'
where telegram_id = <telegram_id>;
```

The representative then opens `/courier-panel`, updates tariffs, routes,
delivery times, the warehouse address, service terms or a promotion, and submits
the change. Nothing is published until an administrator approves it in
**Admin → Kuryerlar**, and both the submission and the decision are written to
the audit log.

---

## Architecture notes

```
src/
├── app/
│   ├── (mini-app)/       # Telegram Mini App routes
│   ├── admin/            # Desktop-first admin panel
│   ├── courier-panel/    # Courier self-service cabinet
│   └── api/              # Route handlers
├── components/           # ui, layout, product, courier, customs, ai, ads
├── features/             # telegram-auth, product-search, recommendations,
│                         # courier-comparison, customs-calculator,
│                         # customs-risk, learning-simulator, seller-assistant,
│                         # screenshot-assistant, reviews, subscriptions,
│                         # consultation, saved, profile, onboarding, admin
├── lib/                  # supabase, telegram, ai, data, validation, currency,
│                         # analytics, storage, api, logger, env, utils
├── types/ hooks/ constants/
```

Three deliberate seams:

- **`DataSource`** (`src/lib/data/types.ts`) — one interface, two
  implementations. `MemoryDataSource` powers demo mode and tests;
  `SupabaseDataSource` powers real deployments. Nothing above this layer knows
  which is in use.
- **`AIProvider`** (`src/types/ai.ts`) — model vendors are a config change.
- **`PaymentProvider`** (`src/features/subscriptions/plans.ts`) — the first
  release activates Premium from the admin panel; a real provider only has to
  implement the interface.

Business logic lives outside components. The recommendation engine, customs
calculator, risk scorers and compatibility checks are pure functions, which is
why the same numbers appear in the UI, the API and the tests.

**Advertising neutrality** is enforced structurally: sponsorship contributes
nothing to `reliabilityScore` or to the safety ranking, paid placements are
always labelled (`Reklama`, `Hamkorlik asosida`, `AI tavsiyasi`,
`Tasdiqlangan kuryer`, `Foydalanuvchilar tanlovi`), affiliate links are
disclosed, and review moderation is admin-only.

**Accessibility**: risk levels carry text and an icon, never colour alone; icons
have `aria-label`s or are marked decorative; touch targets are at least 48px;
body text is never below 13px; the admin panel is keyboard-navigable.

**Offline**: lessons, saved results and the last known tariffs are served from
cached/demo data, and network-dependent actions surface
"Internet aloqasi talab qilinadi. Ulanishni tekshirib, qayta urinib ko'ring."

---

## Security

- Telegram `initData` verified server-side on every request; constant-time hash
  comparison; 24-hour replay window
- `ALLOW_INSECURE_TELEGRAM_AUTH` is a development-only escape hatch and is
  rejected under `APP_ENV=production`
- Role-based authorisation checked on the server for every admin and courier
  route — the client gates are convenience only
- Zod validation and control-character sanitisation on every input; prices and
  statuses come from the server catalogue, never from the client
- Per-user, per-feature rate limiting
- File uploads restricted by MIME type and size; images deleted in a `finally`
  block immediately after analysis
- Prompt-injection defences: pattern stripping, zero-width character removal,
  untrusted-data envelopes, explicit system guardrails
- API keys and the service-role key are server-only
- Audit log records actor, action, entity, previous and new value
- Passport, card and home-address data is never requested or stored; AI logs
  keep only a short, non-identifying summary, and analytics events strip
  personal fields

---

## Disclaimers

Customs figures are estimates:

> Hisob-kitob taxminiy. Yakuniy qaror bojxona organi tomonidan tovar, hujjatlar
> va amaldagi qonunchilik asosida qabul qilinadi.

The bundled customs parameters and courier tariffs are **demo values** for
development. Replace them with verified data (admin → Bojxona qoidalari,
Tariflar) before serving real users.
