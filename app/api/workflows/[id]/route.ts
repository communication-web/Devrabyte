import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireOrgContext, readJson, ok, fail, logAudit } from '@/lib/api';

const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;

  const workflow = await prisma.workflow.findFirst({
    where: { id, organizationId: ctx.organizationId, deletedAt: null },
    include: {
      stages: { orderBy: { order: 'asc' } },
      _count: { select: { tasks: true } },
    },
  });
  if (!workflow) return fail('Workflow not found', 404);
  return ok({ workflow });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireOrgContext('MANAGER');
  if (!ctx.ok) return ctx.response;

  const parsed = await readJson(req, UpdateWorkflowSchema);
  if (!parsed.ok) return parsed.response;

  const existing = await prisma.workflow.findFirst({
    where: { id, organizationId: ctx.organizationId, deletedAt: null },
  });
  if (!existing) return fail('Workflow not found', 404);

  const updated = await prisma.workflow.update({
    where: { id },
    data: parsed.data,
  });

  await logAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: 'workflow.update',
    entity: 'Workflow',
    entityId: id,
    metadata: parsed.data,
  });

  return ok({ workflow: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireOrgContext('ADMIN');
  if (!ctx.ok) return ctx.response;

  const existing = await prisma.workflow.findFirst({
    where: { id, organizationId: ctx.organizationId, deletedAt: null },
  });
  if (!existing) return fail('Workflow not found', 404);

  await prisma.workflow.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  await logAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: 'workflow.delete',
    entity: 'Workflow',
    entityId: id,
  });

  return ok({ deleted: true });
}
