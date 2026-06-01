# Devrabyte AI Ops

> From idea to execution to insight — without the chaos.

AI-powered operations platform for African SMEs. WhatsApp-first by design, with a clean web dashboard for setup, visibility, and reporting. Uses Claude for natural-language parsing, summaries, and bottleneck narration — with deterministic backend logic as the source of truth.

📖 **[DEPLOYMENT.md](./DEPLOYMENT.md)** — step-by-step runbook to get this live on Vercel + Neon + Paystack + WhatsApp Cloud API.  
📖 **[CONTRIBUTING.md](./CONTRIBUTING.md)** — first-run debug guide, common breakages, and how to add new routes/pages.

---

## What's in this repo

A production-grade MVP scaffold:

- **Next.js 15** app (App Router, TypeScript, Tailwind)
- **PostgreSQL + Prisma** multi-tenant schema (24 models, tenant-scoped indexes, soft delete, audit log)
- **Claude integration** — intent parsing (Zod-validated), summaries, bottleneck narration
- **WhatsApp Cloud API** — verified inbound webhook, idempotent processing, outbound messaging
- **Workflows** — 10 SME-ready templates (sales follow-up, client onboarding, service delivery, etc.)
- **Bottleneck engine** — 5 deterministic detection rules with alert de-duplication
- **Reminders** — SLA-aware generation from workflow stages, WhatsApp dispatch
- **Billing** — Paystack integration with signature-verified webhook
- **Admin panel** — super-admin only: health, orgs, audit log
- **Full UI** — landing, auth, onboarding, dashboard, tasks, workflows, team, reports, bottlenecks, settings, billing, WhatsApp

---

## Quick start (local)

**Prereqs:** Node 20+, pnpm (or npm/yarn), PostgreSQL 14+, Redis 6+ (optional — only for BullMQ-backed jobs; the current cron routes run fine without it).

```bash
# 1. Install
pnpm install

# 2. Configure env
cp .env.example .env.local
# edit .env.local — at minimum set DATABASE_URL and AUTH_SECRET

# 3. Prepare the database
pnpm prisma generate
pnpm prisma db push     # or: pnpm prisma migrate dev

# 4. Seed demo data
pnpm db:seed

# 5. Run
pnpm dev
```

App: <http://localhost:3000>

### Demo credentials

| Role         | Email                        | Password   |
| ------------ | ---------------------------- | ---------- |
| Super admin  | `admin@devrabyte.ai`         | `demo1234` |
| Owner        | `owner@demo.devrabyte.ai`    | `demo1234` |
| Admin        | `manager@demo.devrabyte.ai`  | `demo1234` |
| Member       | `mary@demo.devrabyte.ai`     | `demo1234` |
| Member       | `kwame@demo.devrabyte.ai`    | `demo1234` |

Super admins reach the admin panel at `/admin`.

---

## Environment variables

See `.env.example` for the full list. Minimum to boot the app locally:

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — long random string (e.g. `openssl rand -base64 32`)

Optional, enabled as needed:

- `ANTHROPIC_API_KEY` — Claude integration. Without this, WhatsApp parsing + summaries gracefully fall back to deterministic defaults.
- `WHATSAPP_*` — Meta Cloud API credentials for real WhatsApp.
- `PAYSTACK_*` — Paystack keys for billing.
- `CRON_SECRET` — required to call `/api/cron/*` endpoints.

---

## Architecture at a glance

```
Inbound WhatsApp ──────────────┐
                                ▼
Dashboard quick-add ──► /api/ai/quick-parse ──► Claude (Zod-validated Intent)
                                             │
                                             ▼
                                   orchestrator.handleIntent()
                                             │
                                             ▼
                                 deterministic DB execution
                                   (tenant-scoped, audited)
                                             │
                                             ▼
                                    Reply via WhatsApp + UI

Cron every 15 min  ──► /api/cron/daily-summary  (tz-aware per org)
Cron every  5 min  ──► /api/cron/reminders
Cron every  6 hr   ──► /api/cron/bottlenecks
Cron daily 08:00   ──► /api/cron/weekly-summary

Paystack events    ──► /api/webhooks/paystack (signature-verified + re-verified upstream)
```

### Design principle

> AI interprets. Backend validates. Backend executes.

Every AI output is parsed through a **Zod schema** before it touches the database. If Claude is unavailable, the system degrades to deterministic fallbacks — daily summaries use pre-computed stats, WhatsApp replies use help text, workflow execution uses stored rules.

---

## Repo layout

```
app/
  (marketing)/          # Public landing, pricing, FAQ
  (auth)/               # Login, signup
  (app)/                # Authenticated app (sidebar + topbar shell)
    dashboard/          # KPIs, due today, activity, alerts
    tasks/              # List + detail
    workflows/          # List + template import
    team/               # Members + invites
    reports/            # Daily, weekly, workload
    bottlenecks/        # Scan + alerts
    settings/           # Org settings
    billing/            # Plan + Paystack upgrade
    whatsapp/           # Link number + message log
    onboarding/         # 4-step flow
  admin/                # Super-admin only
  api/
    auth/               # signup, login, logout, session
    organizations/      # current, members, onboarding
    tasks/              # CRUD + comments
    workflows/          # CRUD + templates
    reports/            # overview, daily, weekly, bottlenecks, workload
    ai/quick-parse/     # dashboard AI command
    whatsapp/           # webhook (verified), send, link
    webhooks/paystack/  # billing webhook
    cron/               # daily-summary, weekly-summary, bottlenecks, reminders
    admin/              # organizations, health, audit

components/
  ui/                   # Button, Input, Card, Badge, Avatar, EmptyState, …
  dashboard/            # Sidebar, Topbar
  tasks/                # QuickAddDialog, NewTaskDialog

lib/
  ai/
    claude.ts           # Claude client + JSON/text calls
    prompts.ts          # Intent schema + prompt templates
    orchestrator.ts     # Intent → validated DB execution
  auth/
    session.ts          # JWT session (jose), bcrypt, RBAC helpers
    admin.ts            # Super-admin guard
  billing/paystack.ts   # Plan catalog, signature verify, Paystack client
  jobs/
    bottlenecks.ts      # 5-rule detection + alert persistence
    reports.ts          # Daily + weekly summary engines
    reminders.ts        # SLA reminder generation + dispatch
  validators/schemas.ts # Zod schemas for every write path
  wa/client.ts          # WhatsApp Cloud API + HMAC verification
  workflows/templates.ts# 10 SME workflow templates
  api.ts                # ok/fail/readJson, tenant-scoped requireOrgContext
  cron.ts               # CRON_SECRET gate
  db.ts                 # Prisma singleton
  utils.ts              # cn, slugify, randomToken, date helpers

prisma/
  schema.prisma         # 24-model multi-tenant schema
  seed.ts               # Demo workspace + users + tasks
```

---

## Security posture

- **Tenant isolation** — every business-data route calls `requireOrgContext()`; no query runs without an `organizationId` scope.
- **RBAC** — `OWNER > ADMIN > MANAGER > MEMBER`, enforced with a numeric rank in `requireOrgContext(minRole)`.
- **Audit log** — every mutation writes an `AuditLog` row (signup, login, task CRUD, workflow changes, billing, admin actions).
- **Webhook verification** — WhatsApp webhook verifies `x-hub-signature-256` HMAC; Paystack webhook verifies `x-paystack-signature` HMAC *and* re-verifies the transaction upstream before activating a subscription.
- **Idempotency** — WhatsApp messages deduped by `waMessageId`; Paystack invoices deduped by `paystackRef`.
- **AI validation** — all Claude output parsed through Zod schemas before use. Assignee resolution uses ranked string matching against real org members — never trusts free-text names.
- **Session** — httpOnly JWT cookie via `jose`, 30-day TTL, bcrypt password hashing (cost 12).
- **Cron protection** — every `/api/cron/*` endpoint requires `CRON_SECRET` via `Authorization: Bearer` or `?secret=`.

---

## Deployment (Vercel)

1. Push the repo to GitHub.
2. In Vercel, import the project, add all env vars from `.env.example`.
3. Provision Postgres (Vercel Postgres, Neon, or Supabase) — set `DATABASE_URL`.
4. Set `CRON_SECRET` in env and in the cron job `Authorization` header. `vercel.json` already declares the 4 cron jobs.
5. In Meta for Developers, set the WhatsApp webhook URL to
   `https://<your-domain>/api/whatsapp/webhook` with your `WHATSAPP_VERIFY_TOKEN`.
6. In Paystack, set the webhook URL to
   `https://<your-domain>/api/webhooks/paystack`.

---

## What's deliberately out of scope (for now)

- Email notifications (we lean fully on WhatsApp for MVP)
- File attachments via WhatsApp (schema supports it; UI doesn't yet)
- Multi-org switching UI (the API supports users in multiple orgs, but UI uses the first membership)
- Real-time updates (tasks currently re-fetch via `router.refresh()`; add Pusher/SSE in v2)
- SSO
- BullMQ worker (the current cron routes are stateless and run on Vercel Cron; BullMQ is scaffolded in `package.json` for future use)

---

## What to try after `pnpm dev`

1. Log in as the owner, go to **Dashboard** — see KPIs from seeded data.
2. Open **Tasks** — filter by `Overdue`, `Blocked`, `Due today`.
3. Click the **Quick add with AI** bar on the top nav — type *"Assign Mary to call ABC tomorrow, urgent"*.
4. Open **Bottlenecks** → **Run scan** — see the detection engine surface real issues in the seed data.
5. Open **Reports** → **Generate daily** — watch a Claude summary (or fallback) get produced.
6. Sign out, sign in as super admin — see `/admin` with platform KPIs.

---

## License

Proprietary. All rights reserved by Devrabyte.
