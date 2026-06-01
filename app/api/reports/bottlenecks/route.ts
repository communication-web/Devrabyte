import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireOrgContext, readJson, ok, fail, logAudit } from '@/lib/api';
import { detectBottlenecks, persistBottleneckAlerts } from '@/lib/jobs/bottlenecks';
import { callClaudeText } from '@/lib/ai/claude';
import { BOTTLENECK_SYSTEM } from '@/lib/ai/prompts';

/**
 * GET  /api/reports/bottlenecks              -> list current alerts
 * GET  /api/reports/bottlenecks?scan=1       -> run detection now + narrate + return
 * POST /api/reports/bottlenecks/ack { id }   -> acknowledge one alert
 */

export async function GET(req: NextRequest) {
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;

  const url = new URL(req.url);

  if (url.searchParams.get('scan') === '1') {
    const findings = await detectBottlenecks(ctx.organizationId);
    await persistBottleneckAlerts(ctx.organizationId, findings);

    let narrative: string | null = null;
    if (findings.length) {
      const factPack = findings
        .map((f) => `- [${f.severity}] ${f.title}: ${f.description}`)
        .join('\n');
      narrative = await callClaudeText({
        system: BOTTLENECK_SYSTEM,
        user: `Findings for ${ctx.organization.name}:\n${factPack}\n\nExplain and suggest next actions.`,
        maxTokens: 400,
      });
    }

    await logAudit({
      organizationId: ctx.organizationId,
      actorId: ctx.user.id,
      action: 'bottleneck.scan',
      entity: 'Organization',
      entityId: ctx.organizationId,
      metadata: { count: findings.length },
    });

    return ok({ findings, narrative });
  }

  const alerts = await prisma.alert.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: [{ acknowledgedAt: 'asc' }, { createdAt: 'desc' }],
    take: 50,
  });
  return ok({ alerts });
}

const AckSchema = z.object({ id: z.string().cuid() });

export async function POST(req: NextRequest) {
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;

  const parsed = await readJson(req, AckSchema);
  if (!parsed.ok) return parsed.response;

  const alert = await prisma.alert.findFirst({
    where: { id: parsed.data.id, organizationId: ctx.organizationId },
  });
  if (!alert) return fail('Alert not found', 404);

  const updated = await prisma.alert.update({
    where: { id: alert.id },
    data: { acknowledgedAt: new Date() },
  });

  await logAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: 'bottleneck.ack',
    entity: 'Alert',
    entityId: alert.id,
  });

  return ok({ alert: updated });
}
