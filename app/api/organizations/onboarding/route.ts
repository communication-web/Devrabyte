import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOrgContext, readJson, ok, logAudit } from '@/lib/api';
import { OnboardingSchema } from '@/lib/validators/schemas';
import { getTemplate } from '@/lib/workflows/templates';

export async function POST(req: NextRequest) {
  const ctx = await requireOrgContext('OWNER');
  if (!ctx.ok) return ctx.response;

  const parsed = await readJson(req, OnboardingSchema);
  if (!parsed.ok) return parsed.response;
  const d = parsed.data;

  await prisma.organization.update({
    where: { id: ctx.organizationId },
    data: {
      industry: d.industry ?? null,
      teamSize: d.teamSize ?? null,
      dailySummaryAt: d.dailySummaryAt,
      timezone: d.timezone,
    },
  });

  // Seed chosen template workflow
  if (d.templateKey) {
    const tpl = getTemplate(d.templateKey);
    if (tpl) {
      const existing = await prisma.workflow.findFirst({
        where: { organizationId: ctx.organizationId, templateKey: tpl.key, deletedAt: null },
      });
      if (!existing) {
        await prisma.workflow.create({
          data: {
            organizationId: ctx.organizationId,
            name: tpl.name,
            description: tpl.description,
            templateKey: tpl.key,
            stages: {
              create: tpl.stages.map((s) => ({
                name: s.name,
                order: s.order,
                slaHours: s.slaHours ?? null,
                reminderHours: s.reminderHours ?? null,
                requiresApproval: s.requiresApproval ?? false,
              })),
            },
          },
        });
      }
    }
  }

  await logAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: 'org.onboarded',
    entity: 'Organization',
    entityId: ctx.organizationId,
    metadata: d,
  });

  return ok({ done: true, redirectTo: '/dashboard' });
}
