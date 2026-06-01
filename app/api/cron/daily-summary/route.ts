import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authorizeCron } from '@/lib/cron';
import { generateDailySummary } from '@/lib/jobs/reports';
import { sendWhatsAppText } from '@/lib/wa/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Run this cron every 15 minutes. For each org, we check if the current time
 * (in the org's timezone) matches its configured dailySummaryAt HH:mm.
 * If yes, generate the summary and send it to every owner/admin with a phone.
 */
export async function GET(req: NextRequest) {
  const unauth = authorizeCron(req);
  if (unauth) return unauth;

  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null },
    include: {
      memberships: {
        where: { role: { in: ['OWNER', 'ADMIN'] } },
        include: { user: { select: { phone: true, name: true } } },
      },
    },
  });

  const now = new Date();
  const results: { orgId: string; sent: number; skipped: boolean }[] = [];

  for (const org of orgs) {
    const shouldRun = isMatchingLocalTime(now, org.timezone, org.dailySummaryAt);
    if (!shouldRun) {
      results.push({ orgId: org.id, sent: 0, skipped: true });
      continue;
    }

    try {
      const { summary } = await generateDailySummary(org.id, org.name);
      let sent = 0;
      for (const m of org.memberships) {
        if (!m.user.phone) continue;
        const res = await sendWhatsAppText(m.user.phone, `☀️ Daily at ${org.name}\n\n${summary}`);
        if (res) sent++;
      }
      results.push({ orgId: org.id, sent, skipped: false });
    } catch (err) {
      console.error('[cron:daily] failed for', org.id, err);
      results.push({ orgId: org.id, sent: 0, skipped: false });
    }
  }

  return NextResponse.json({ ok: true, results });
}

/**
 * Returns true if the current local time in the given IANA tz matches HH:mm
 * within a 15-minute window (to account for cron granularity).
 */
function isMatchingLocalTime(now: Date, tz: string, hhmm: string): boolean {
  try {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const [h, m] = fmt.format(now).split(':').map((x) => parseInt(x, 10));
    const [th, tm] = hhmm.split(':').map((x) => parseInt(x, 10));
    const nowMin = h * 60 + m;
    const tgtMin = th * 60 + tm;
    return Math.abs(nowMin - tgtMin) <= 7; // within ~15-min window
  } catch {
    return false;
  }
}
