# Contributing & first-run debug guide

## The honest state of this scaffold

This codebase was generated rapidly and hasn't been run end-to-end. The logic and architecture are coherent, but you'll likely hit 5-10 small issues on first boot — the kind of things a human developer catches in 30 minutes with their IDE open.

This guide tells you how to find and fix them fast.

---

## The 30-minute first-run checklist

### 1. Typecheck first, run second

```bash
pnpm install
pnpm prisma generate      # generates @prisma/client types
pnpm typecheck            # runs tsc --noEmit
```

Expect 0-10 type errors. Most will be one of:

- **Missing import** — `Cannot find name 'X'`. Fix: add the import.
- **Unknown property on Prisma type** — usually because a field was renamed in the schema but not updated in a page. Fix: check `prisma/schema.prisma` for the actual field name.
- **`sp.q ?? ''` complains** — searchParams types in Next 15. Fix: cast or use `typeof sp.q === 'string' ? sp.q : ''`.

### 2. Then push the schema

```bash
pnpm prisma db push
```

If this fails:
- **"Can't reach database"** — check `DATABASE_URL`; is Postgres running?
- **"column X of relation Y does not exist"** — you have an existing DB from a previous version. Drop it and retry: `pnpm prisma db push --force-reset`.

### 3. Seed

```bash
pnpm db:seed
```

If this fails on an import path (`Cannot find module '../lib/workflows/templates'`), the seed script uses relative imports. It's located at `prisma/seed.ts` importing from `../lib/workflows/templates` — that path must exist.

### 4. Run

```bash
pnpm dev
```

Visit <http://localhost:3000>. You should see the landing page.

---

## Known likely-breaks and fixes

Below are specific things I'd look for *first* when something doesn't work:

### `layout.tsx` says "export default async function" but client hooks error

Some pages mix server and client components. If you see "You're importing a component that needs useState. It only works in a Client Component":

- The file is a server component (no `'use client'` at the top)
- But it's trying to use a hook
- **Fix**: split the interactive part into a separate file with `'use client'` at the top

The scaffold already splits these properly (e.g. `tasks/page.tsx` server + `tasks/tasks-list.tsx` client), but verify none accidentally got combined.

### Prisma types don't include new fields

After editing `schema.prisma`:

```bash
pnpm prisma generate
# restart your IDE's TypeScript server (VS Code: ⌘⇧P → "Restart TS Server")
```

### Middleware redirects you into a loop

If `/dashboard` keeps bouncing to `/login` even though you're signed in:

1. Open devtools → Application → Cookies. Is `devrabyte_session` present?
2. In `lib/auth/session.ts`, check that `AUTH_COOKIE_NAME` env var matches what middleware reads.
3. Try an incognito window with a fresh login.

### "A server component rendered an event handler"

A function prop was passed from a server component to a client component. Check the boundary — the parent should be `'use client'` or the handler should be inlined.

### Claude calls fail silently

By design, if `ANTHROPIC_API_KEY` is missing or the call fails, the orchestrator degrades to deterministic fallbacks and writes to the browser console. To verify Claude is actually being called, add this at the top of `lib/ai/claude.ts`:

```ts
console.log('[claude] anthropic key:', !!process.env.ANTHROPIC_API_KEY);
```

### Quick-add dialog doesn't close after creating a task

The dialog does `router.refresh()` then `setTimeout(() => onOpenChange(false), 600)`. If you're not seeing the refresh, check devtools Network — the `/api/ai/quick-parse` call should return `{ok: true}` with an `intent` object.

### Tasks don't appear after creation

`router.refresh()` re-runs the server component. If the page shows stale data:
- The task wasn't actually saved (check Network tab for a 4xx response from `/api/tasks`).
- OR tenant isolation mismatch — confirm the logged-in user's membership org ID matches the task's `organizationId`.

### WhatsApp webhook returns 401

The HMAC signature verification (`verifyWebhookSignature` in `lib/wa/client.ts`) requires `WHATSAPP_APP_SECRET`. If you set it, Meta's request must be signed with it — but the **test sender** in Meta's sandbox sometimes skips signing. For local testing with ngrok:

- Leave `WHATSAPP_APP_SECRET` unset for dev to skip verification (the route handles this case).
- Set it in production only.

### `vercel-build` fails with "migration file not found"

If you haven't created migration files yet (i.e. you've only ever run `db push`), swap `vercel-build` to use `db push` instead of `migrate deploy`:

```json
"vercel-build": "prisma generate && prisma db push --skip-generate && next build"
```

**But for production, you should really use migrations** — run `pnpm prisma migrate dev --name init` locally first, commit the `prisma/migrations/` folder, then `migrate deploy` will work.

---

## Adding a new API route

1. Create `app/api/your-thing/route.ts`.
2. Use `requireOrgContext()` (or `requireOrgContext('ADMIN')` for role gating).
3. Validate input with a Zod schema via `readJson(req, YourSchema)`.
4. Call `logAudit()` on mutations.
5. Return `ok()` / `fail()` from `@/lib/api`.

Template:

```ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireOrgContext, readJson, ok, fail, logAudit } from '@/lib/api';
import { prisma } from '@/lib/db';

const BodySchema = z.object({ ... });

export async function POST(req: NextRequest) {
  const ctx = await requireOrgContext('MANAGER');
  if (!ctx.ok) return ctx.response;

  const parsed = await readJson(req, BodySchema);
  if (!parsed.ok) return parsed.response;

  // ... your logic
  
  await logAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: 'your.action',
    entity: 'YourEntity',
    entityId: id,
  });
  
  return ok({ result });
}
```

---

## Adding a new page

Server components fetch data; client components handle interaction.

```
app/(app)/your-page/
├── page.tsx              ← server component, imports requireOrg, queries Prisma
└── your-page-client.tsx  ← client component with 'use client', handles forms
```

Pattern to follow (mirrors `tasks/page.tsx` → `tasks/tasks-list.tsx`):

```tsx
// page.tsx
import { requireOrg } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { YourClient } from './your-client';

export default async function YourPage() {
  const { organization } = await requireOrg();
  const data = await prisma.yourModel.findMany({
    where: { organizationId: organization.id },
  });
  return <YourClient data={data} />;
}
```

---

## Style guidelines

- **Tailwind only** — no inline `style=` unless absolutely necessary (Avatar is the one exception).
- **CSS variables for theme colors** — `text-foreground`, `bg-card`, `border-border`. Don't hardcode `#ffffff`.
- **Sentence case everywhere** — buttons, headings, empty states. Never Title Case.
- **`font-display` only for headings** and brand moments; body text stays `font-sans`.
- **`tabular` utility** for any number that appears in a KPI or table.
- **Avatar → deterministic hue from name** — don't pass colors, just name.
