import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authorizeCron } from '@/lib/cron';
import { generateWeeklySummary } from '@/lib/jobs/reports';
import { sendWhatsAppText } from '@/lib/wa/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const unauth = authorizeCron(req);
  if (unauth) return unauth;

  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null },
    include: {
      settings: true,
      memberships: {
        where: { role: { in: ['OWNER', 'ADMIN'] } },
        include: { user: { select: { phone: true } } },
      },
    },
  });

  const today = new Date();
  const dow = today.getDay(); // 0=Sun, 1=Mon, ...
  const results: { orgId: string; sent: number; skipped: boolean }[] = [];

  for (const org of orgs) {
    const targetDay = org.settings?.weeklyReportDay ?? 1;
    if (dow !== targetDay) {
      results.push({ orgId: org.id, sent: 0, skipped: true });
      continue;
    }

    try {
      const { summary } = await generateWeeklySummary(org.id, org.name);
      let sent = 0;
      for (const m of org.memberships) {
        if (!m.user.phone) continue;
        const res = await sendWhatsAppText(
          m.user.phone,
          `📅 Weekly recap — ${org.name}\n\n${summary}`,
        );
        if (res) sent++;
      }
      results.push({ orgId: org.id, sent, skipped: false });
    } catch (err) {
      console.error('[cron:weekly] failed for', org.id, err);
      results.push({ orgId: org.id, sent: 0, skipped: false });
    }
  }

  return NextResponse.json({ ok: true, results });
}
