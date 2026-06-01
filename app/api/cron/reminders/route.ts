import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authorizeCron } from '@/lib/cron';
import { ensureStageReminders, processDueReminders } from '@/lib/jobs/reminders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Runs every 5 minutes.
 * 1) For every active org, generate stage-SLA reminders that don't yet exist.
 * 2) Dispatch any reminders whose remindAt <= now.
 */
export async function GET(req: NextRequest) {
  const unauth = authorizeCron(req);
  if (unauth) return unauth;

  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  let generated = 0;
  for (const o of orgs) {
    try {
      generated += await ensureStageReminders(o.id);
    } catch (err) {
      console.error('[cron:reminders] ensure failed for', o.id, err);
    }
  }

  const sent = await processDueReminders();

  return NextResponse.json({ ok: true, generated, sent });
}
