# Deployment runbook — Devrabyte AI Ops

This is the step-by-step to go from the zip on disk to a live app at `https://your-domain`.

Realistic total time: **3-4 hours** if you have nothing set up yet, **45 minutes** if you already have Vercel + a Postgres host + a Meta developer account. The single slowest thing is **Meta approving your WhatsApp Business number** — that can take anywhere from 24 hours to a week. You can launch everything else first and add WhatsApp last.

Follow the sections in order. Steps marked **★** are where people usually trip.

---

## Stage 0 — Prereqs

- A domain you control (or you can launch on `*.vercel.app` and add the domain later).
- Accounts: [GitHub](https://github.com), [Vercel](https://vercel.com), [Neon](https://neon.tech) (or Supabase/Vercel Postgres), [Anthropic](https://console.anthropic.com), [Paystack](https://paystack.com) for billing, [Meta for Developers](https://developers.facebook.com) for WhatsApp.
- `pnpm` installed locally (`npm install -g pnpm`) — the build script assumes it.

---

## Stage 1 — Get it running locally (30 min)

This confirms the code compiles against your machine before you push anything.

```bash
unzip devrabyte.zip
cd devrabyte
pnpm install
```

If `pnpm install` fails on a peer-dependency warning, run it with `--no-strict-peer-dependencies`. The `package.json` already pins a React 19 + Next 15.1 combo that installs cleanly on Node 20/22.

### 1.1 Provision a local database

Fastest path:

```bash
# Using Docker:
docker run --name devrabyte-pg -e POSTGRES_PASSWORD=devrabyte -e POSTGRES_USER=devrabyte -e POSTGRES_DB=devrabyte -p 5432:5432 -d postgres:16
```

Or install Postgres directly (`brew install postgresql@16` on macOS, `apt install postgresql` on Ubuntu).

### 1.2 Configure `.env.local`

```bash
cp .env.example .env.local
```

Edit `.env.local` — at this stage set **only** these two:

```
DATABASE_URL="postgresql://devrabyte:devrabyte@localhost:5432/devrabyte?schema=public"
AUTH_SECRET="$(openssl rand -base64 32)"
```

### 1.3 Create schema + seed

```bash
pnpm prisma generate
pnpm prisma db push
pnpm db:seed
pnpm dev
```

Open <http://localhost:3000>. You should see the marketing page. Log in at `/login` with `owner@demo.devrabyte.ai` / `demo1234`. If the dashboard loads with KPIs and seeded tasks, your local is working. Proceed.

**★ First-run hiccups you might hit:**
- `Module not found: @prisma/client` → run `pnpm prisma generate` and restart.
- `relation "..." does not exist` → you didn't run `db push`.
- Blank page at `/dashboard` → check browser console; most likely an import path.

---

## Stage 2 — Provision production Postgres (15 min)

### Option A: Neon (recommended)

1. Create a project at <https://console.neon.tech>.
2. Pick a region near your users (EU West or US East for Africa).
3. On the project dashboard, under **Connection Details**, toggle **Pooled connection**.
4. Copy two connection strings:
   - The **pooled** one → this is `DATABASE_URL`.
   - The **direct** (unpooled) one → this is `DIRECT_URL` (Prisma migrations need this).

### Option B: Supabase

Create a project, go to **Settings → Database → Connection string**. Use the **Transaction pooler** URI as `DATABASE_URL` and the **Session pooler** URI as `DIRECT_URL`.

### Option C: Vercel Postgres

From the Vercel dashboard, **Storage → Create → Postgres**. It sets `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING` — map the first to `DATABASE_URL` and the second to `DIRECT_URL` in your env.

---

## Stage 3 — Deploy to Vercel (20 min)

### 3.1 Push to GitHub

```bash
cd devrabyte
git init
git add .
git commit -m "Initial commit"
# Create a repo on github.com, then:
git remote add origin git@github.com:your-org/devrabyte-ai-ops.git
git push -u origin main
```

### 3.2 Import into Vercel

1. <https://vercel.com/new> → **Import Git Repository**.
2. Pick your repo.
3. **Framework preset**: Next.js (should auto-detect).
4. **Build command**: leave as auto (our `vercel.json` already specifies `pnpm vercel-build`).
5. **Root directory**: leave blank.
6. Before clicking Deploy, expand **Environment Variables** and add at minimum:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | pooled connection string from Stage 2 |
| `DIRECT_URL` | unpooled connection string from Stage 2 |
| `AUTH_SECRET` | a fresh `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` (update after custom domain) |
| `CRON_SECRET` | a fresh `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | from <https://console.anthropic.com/settings/keys> |
| `ANTHROPIC_MODEL` | `claude-opus-4-7` |

7. Click **Deploy**. First build should complete in ~2-3 minutes.

The `vercel-build` script runs `prisma migrate deploy` before `next build`. On first deploy, your database schema is created. On future deploys, any new migrations run automatically.

### 3.3 Verify

Visit `https://your-project.vercel.app/api/health`. You should see:

```json
{"ok":true,"service":"devrabyte-ai-ops","db":"up",...}
```

Log in on the live site with `owner@demo.devrabyte.ai` / `demo1234` (seeded by `db:seed`). **★** If you didn't run the seed on the production DB, sign up fresh instead.

To run the seed against production:

```bash
DATABASE_URL="$PROD_DATABASE_URL" pnpm db:seed
```

### 3.4 Custom domain

Vercel → your project → **Settings → Domains → Add**. Follow the DNS instructions. Once live, update `NEXT_PUBLIC_APP_URL` to the new domain and redeploy.

---

## Stage 4 — Crons & rate limiting (10 min)

### 4.1 Crons

`vercel.json` already declares all four cron endpoints. After deploy, in the Vercel dashboard → **your project → Settings → Cron Jobs**, you should see:

- `/api/cron/daily-summary` — every 15 minutes
- `/api/cron/reminders` — every 5 minutes
- `/api/cron/bottlenecks` — every 6 hours
- `/api/cron/weekly-summary` — daily at 08:00

Vercel automatically includes the `Authorization: Bearer <CRON_SECRET>` header. Our cron guard (`lib/cron.ts`) accepts it.

**★** If you're on Vercel's Hobby tier, you get 2 cron jobs max. Remove `weekly-summary` and `bottlenecks` from `vercel.json` — the daily summary cron can call the bottleneck scan inline if you want.

### 4.2 Rate limiting with Upstash

Optional but strongly recommended before opening signups publicly.

1. <https://upstash.com> → Create → Redis.
2. Pick the same region as your Vercel deployment.
3. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` into Vercel env.
4. Redeploy. Login, signup, and the AI quick-parse endpoint now use distributed rate limits. Without Upstash, they fall back to per-instance in-memory limits — fine for low traffic.

---

## Stage 5 — Paystack (30 min)

### 5.1 Merchant onboarding

1. Create an account at <https://dashboard.paystack.com>.
2. Complete business verification (BVN + business docs for Nigerian accounts). This is the slowest non-WhatsApp step — can take a day.
3. Go to **Settings → API Keys & Webhooks**.

### 5.2 Add keys

Copy these to Vercel env:

- `PAYSTACK_SECRET_KEY` — your **secret key** (starts with `sk_live_` for prod, `sk_test_` for test).
- `PAYSTACK_PUBLIC_KEY` — public key.

### 5.3 Configure webhook

Still in **Settings → API Keys & Webhooks**:

- **Webhook URL**: `https://your-domain/api/webhooks/paystack`
- Click **Save**.

Our handler verifies the signature using your **secret key** (that's how Paystack signs webhooks), then re-verifies every transaction by calling Paystack's verify endpoint — so even if someone spoofs a webhook, we won't activate their plan.

### 5.4 Test

1. In the dashboard, go to `/billing` as an OWNER.
2. Click "Switch to starter". You're redirected to Paystack checkout.
3. Use a [test card](https://paystack.com/docs/payments/test-payments): `4084 0840 8408 4081`, any future date, any CVV, OTP `123456`.
4. After success, the webhook fires. Check `/billing` — plan should show as `starter` with a `paid` invoice.

---

## Stage 6 — WhatsApp Cloud API (30 min active + approval wait)

### 6.1 Create a Meta app

1. <https://developers.facebook.com/apps/creation> → **Business** type → name it "Devrabyte AI Ops".
2. In the app dashboard, under **Add products**, add **WhatsApp**.

### 6.2 Test phone number (immediate)

Meta gives you a test sender number out of the box. Under **WhatsApp → API Setup**:

- Copy **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`.
- Copy the temporary **Access token** → `WHATSAPP_ACCESS_TOKEN` (this one expires in 24h; you'll replace it in 6.4).
- Also add your personal WhatsApp number as a test recipient so the sandbox will send you messages.

Under **App Settings → Basic**:

- Copy **App Secret** → `WHATSAPP_APP_SECRET`.

Generate a long random string for `WHATSAPP_VERIFY_TOKEN` — it only needs to match between your env and Meta's callback config.

### 6.3 Configure webhook

**WhatsApp → Configuration → Edit** callback:

- **Callback URL**: `https://your-domain/api/whatsapp/webhook`
- **Verify token**: paste the value of `WHATSAPP_VERIFY_TOKEN`.
- Click **Verify and save**. Meta hits our endpoint with `hub.mode=subscribe&hub.verify_token=...&hub.challenge=...`; we echo back the challenge.
- Subscribe to the **`messages`** webhook field.

### 6.4 Permanent access token

The temporary token from 6.2 expires. Generate a permanent one:

1. Go to <https://business.facebook.com/settings/system-users>.
2. Create a system user (Admin role).
3. Generate a token with `whatsapp_business_messaging` and `whatsapp_business_management` permissions. Select **Never expire**.
4. Replace `WHATSAPP_ACCESS_TOKEN` in Vercel.

### 6.5 Test the loop

1. In the dashboard, go to `/whatsapp`. Link your personal number (the one you added as a test recipient).
2. From your phone, message the Meta-provided test number with: *"What's pending today?"*
3. Within ~3 seconds you should get a reply listing your tasks.
4. Try: *"Assign Mary to call ABC Ltd tomorrow 10am, urgent"*. A task should appear on `/tasks`.

### 6.6 Production number (slow)

To use a real business number (not the Meta sandbox):

1. **WhatsApp → API Setup → Add phone number**.
2. Meta walks you through business verification. You'll need: business docs, proof of ownership of the phone number, and to use a number that has never been used on personal WhatsApp.
3. Approval takes **24 hours to 7 days** depending on documentation completeness.
4. Once approved, update `WHATSAPP_PHONE_NUMBER_ID` to the new number.

---

## Stage 7 — Smoke test the full stack (10 min)

Walk through these against the live URL:

- [ ] `/api/health` returns `{ok: true}` and all integrations show `configured`
- [ ] `/` renders the marketing page
- [ ] `/signup` creates a new workspace
- [ ] Onboarding → dashboard transition works
- [ ] Quick-add (⌘K) with *"Task: follow up vendor tomorrow"* creates a task
- [ ] Task detail page lets you change status, reassign, comment
- [ ] `/bottlenecks` → **Run scan** returns findings (will be empty on fresh workspace)
- [ ] `/reports` → **Generate daily** produces a summary
- [ ] `/billing` → upgrade flow redirects to Paystack and back
- [ ] WhatsApp message → task creation works round-trip
- [ ] `/admin` is accessible only as super admin (log in as `admin@devrabyte.ai`)
- [ ] Vercel → Logs tab shows no recurring errors

If all green, you're live.

---

## Stage 8 — Things to do before public launch

These are important-but-not-blocking for an internal/closed beta:

- [ ] Set up **Sentry** for error tracking. Add `SENTRY_DSN` to Vercel env, install `@sentry/nextjs`, wrap with their SDK.
- [ ] Set up **uptime monitoring** — point [BetterStack](https://betterstack.com) or [UptimeRobot](https://uptimerobot.com) at `/api/health`.
- [ ] Write a **privacy policy** and **terms** — particularly important because you're handling WhatsApp messages. Add `/privacy` and `/terms` pages.
- [ ] **Email** — password reset currently doesn't send; you need a provider. Resend is the fastest (<https://resend.com>) — add `RESEND_API_KEY`, plug into invite/reset flows.
- [ ] **Rotate demo credentials** — remove or reset `admin@devrabyte.ai` / `owner@demo.devrabyte.ai` on production before public launch.
- [ ] **Set up a staging branch** — create a Vercel preview deployment from a `staging` branch, pointed at a separate Neon branch database.

---

## Troubleshooting playbook

**Build fails on Vercel with "Environment variable DATABASE_URL is missing"**
→ Env vars weren't added before first deploy. Add them in Project Settings → Environment Variables and redeploy.

**`Error: P1001 Can't reach database server`**
→ You're using a pooled URL for migrations. Set `DIRECT_URL` to the unpooled connection string.

**Login succeeds but `/dashboard` redirects back to `/login`**
→ Cookie domain mismatch, usually from `NEXT_PUBLIC_APP_URL` not matching your actual URL. Confirm they match and the middleware cookie name is `devrabyte_session`.

**WhatsApp webhook returns 401**
→ `WHATSAPP_APP_SECRET` doesn't match the app's actual secret. Regenerate in Meta App Settings → Basic and update the env var.

**Paystack webhook fires but no plan change**
→ Check Vercel function logs for `/api/webhooks/paystack`. Common causes: signature mismatch (wrong `PAYSTACK_SECRET_KEY`) or metadata missing `organizationId` (should never happen if the upgrade was initiated from `/billing`).

**Cron jobs don't run**
→ Vercel Hobby tier limits you to 2 crons. Either upgrade or trim `vercel.json`.

**"fetch failed" errors from Claude calls**
→ Check `ANTHROPIC_API_KEY` is set and valid. The system degrades gracefully — you'll get fallback messages instead of errors if the key is missing.

---

## What's not in this runbook (on purpose)

- **SSO / SAML** — not needed for MVP, add at enterprise stage.
- **BullMQ worker** — current cron routes are stateless and work on Vercel. Add a worker only if you outgrow 5-minute cron granularity.
- **Multi-region / HA** — Neon + Vercel is already HA for the AZ level. Multi-region is a v2 decision.
- **Compliance** — GDPR data export/delete, SOC 2 etc. Follow up with legal once you have real customers.
