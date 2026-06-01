import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authorizeCron } from '@/lib/cron';
import { detectBottlenecks, persistBottleneckAlerts } from '@/lib/jobs/bottlenecks';
import { sendWhatsAppText } from '@/lib/wa/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const unauth = authorizeCron(req);
  if (unauth) return unauth;

  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null },
    include: {
      memberships: {
        where: { role: { in: ['OWNER', 'ADMIN'] } },
        include: { user: { select: { phone: true } } },
      },
    },
  });

  const results: { orgId: string; newAlerts: number }[] = [];

  for (const org of orgs) {
    try {
      const findings = await detectBottlenecks(org.id);
      const persisted = await persistBottleneckAlerts(org.id, findings);
      results.push({ orgId: org.id, newAlerts: persisted });

      // Notify owners of CRITICAL alerts via WhatsApp
      const critical = findings.filter((f) => f.severity === 'CRITICAL');
      if (persisted > 0 && critical.length > 0) {
        const body =
          `🚨 ${org.name} — ${critical.length} critical issue(s):\n` +
          critical.map((c) => `• ${c.title}`).join('\n') +
          `\n\nOpen the dashboard to review.`;
        for (const m of org.memberships) {
          if (m.user.phone) await sendWhatsAppText(m.user.phone, body);
        }
      }
    } catch (err) {
      console.error('[cron:bottleneck] failed for', org.id, err);
      results.push({ orgId: org.id, newAlerts: 0 });
    }
  }

  return NextResponse.json({ ok: true, results });
}
