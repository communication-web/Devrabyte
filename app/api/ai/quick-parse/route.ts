import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireOrgContext, readJson, ok, fail } from '@/lib/api';
import { parseMessageIntent, handleIntent } from '@/lib/ai/orchestrator';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

const QuickParseSchema = z.object({
  text: z.string().min(1).max(2000),
  execute: z.boolean().default(false),
});

/**
 * /api/ai/quick-parse
 * Lets the dashboard parse freeform commands ("assign Mary to follow up ABC tomorrow").
 * If execute=true, actually runs the intent. Otherwise only returns the parsed structure
 * for preview.
 */
export async function POST(req: NextRequest) {
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;

  // Per-org AI rate limit to cap runaway cost from a single workspace
  const rl = await rateLimit(req, {
    key: 'ai-quick',
    id: ctx.organizationId,
    limit: 60,
    windowSec: 60,
  });
  if (!rl.allowed) return fail('AI rate limit reached for your workspace, try again in a minute', 429);

  const parsed = await readJson(req, QuickParseSchema);
  if (!parsed.ok) return parsed.response;

  const org = await prisma.organization.findUnique({ where: { id: ctx.organizationId } });
  if (!org) return ok({ intent: null, reply: 'Org not found' });

  const intent = await parseMessageIntent({
    text: parsed.data.text,
    organization: org,
    senderUser: ctx.user,
  });

  if (!intent) return ok({ intent: null, reply: 'AI unavailable. Try again or add task manually.' });

  if (!parsed.data.execute) return ok({ intent, reply: intent.reply_message });

  const reply = await handleIntent(intent, {
    organization: org,
    senderUser: ctx.user,
    senderPhone: ctx.user.phone ?? '',
  });
  return ok({ intent, reply });
}
