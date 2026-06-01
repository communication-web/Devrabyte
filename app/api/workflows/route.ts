import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOrgContext, readJson, ok, fail, logAudit } from '@/lib/api';
import { CreateWorkflowSchema } from '@/lib/validators/schemas';
import { WORKFLOW_TEMPLATES, getTemplate } from '@/lib/workflows/templates';

export async function GET(req: NextRequest) {
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;

  const url = new URL(req.url);
  if (url.searchParams.get('templates') === '1') {
    return ok({ templates: WORKFLOW_TEMPLATES });
  }

  const workflows = await prisma.workflow.findMany({
    where: { organizationId: ctx.organizationId, deletedAt: null },
    include: {
      stages: { orderBy: { order: 'asc' } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return ok({ workflows });
}

export async function POST(req: NextRequest) {
  const ctx = await requireOrgContext('MANAGER');
  if (!ctx.ok) return ctx.response;

  const parsed = await readJson(req, CreateWorkflowSchema);
  if (!parsed.ok) return parsed.response;
  const d = parsed.data;

  // If templateKey is supplied, enrich stages with template defaults when missing
  let stages = d.stages;
  if (d.templateKey) {
    const tpl = getTemplate(d.templateKey);
    if (!tpl) return fail('Unknown template', 422);
    // Use template stages verbatim unless caller overrode
    if (stages.length === 0) {
      stages = tpl.stages.map((s) => ({
        name: s.name,
        order: s.order,
        slaHours: s.slaHours ?? null,
        reminderHours: s.reminderHours ?? null,
        requiresApproval: s.requiresApproval ?? false,
      }));
    }
  }

  const workflow = await prisma.workflow.create({
    data: {
      organizationId: ctx.organizationId,
      name: d.name,
      description: d.description ?? null,
      templateKey: d.templateKey ?? null,
      stages: {
        create: stages.map((s) => ({
          name: s.name,
          order: s.order,
          slaHours: s.slaHours ?? null,
          reminderHours: s.reminderHours ?? null,
          requiresApproval: s.requiresApproval,
        })),
      },
    },
    include: { stages: { orderBy: { order: 'asc' } } },
  });

  await logAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: 'workflow.create',
    entity: 'Workflow',
    entityId: workflow.id,
  });

  return ok({ workflow }, 201);
}
