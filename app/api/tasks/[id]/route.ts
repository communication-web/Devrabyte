import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOrgContext, readJson, ok, fail, logAudit } from '@/lib/api';
import { UpdateTaskSchema } from '@/lib/validators/schemas';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;

  const task = await prisma.task.findFirst({
    where: { id, organizationId: ctx.organizationId, deletedAt: null },
    include: {
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      workflow: { select: { id: true, name: true } },
      stage: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, name: true, email: true } } },
      },
      history: { orderBy: { createdAt: 'desc' }, take: 50 },
      attachments: true,
    },
  });
  if (!task) return fail('Task not found', 404);
  return ok({ task });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;

  const parsed = await readJson(req, UpdateTaskSchema);
  if (!parsed.ok) return parsed.response;
  const d = parsed.data;

  const existing = await prisma.task.findFirst({
    where: { id, organizationId: ctx.organizationId, deletedAt: null },
  });
  if (!existing) return fail('Task not found', 404);

  // Members can only update tasks assigned to them or ones they created.
  // Managers/admins/owners can update any task in the org.
  const canFullEdit = ['OWNER', 'ADMIN', 'MANAGER'].includes(ctx.membership.role);
  if (!canFullEdit && existing.assigneeId !== ctx.user.id && existing.createdById !== ctx.user.id) {
    return fail('You can only update your own tasks', 403);
  }

  // Validate assignee membership if changing
  if (d.assigneeId !== undefined && d.assigneeId !== null) {
    const m = await prisma.membership.findUnique({
      where: { userId_organizationId: { userId: d.assigneeId, organizationId: ctx.organizationId } },
    });
    if (!m) return fail('Assignee not in organization', 422);
  }

  const statusChanged = d.status && d.status !== existing.status;
  const completedAt = statusChanged && d.status === 'DONE' ? new Date() : d.status && d.status !== 'DONE' ? null : existing.completedAt;

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(d.title !== undefined && { title: d.title }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.assigneeId !== undefined && { assigneeId: d.assigneeId }),
      ...(d.workflowId !== undefined && { workflowId: d.workflowId }),
      ...(d.stageId !== undefined && { stageId: d.stageId }),
      ...(d.dueAt !== undefined && { dueAt: d.dueAt ? new Date(d.dueAt) : null }),
      ...(d.priority !== undefined && { priority: d.priority }),
      ...(d.status !== undefined && { status: d.status }),
      ...(d.blockedReason !== undefined && { blockedReason: d.blockedReason }),
      ...(d.tags !== undefined && { tags: d.tags }),
      completedAt,
    },
  });

  // Record history entries for meaningful changes
  const historyOps = [];
  if (statusChanged) {
    historyOps.push(
      prisma.taskHistory.create({
        data: {
          taskId: id,
          actorId: ctx.user.id,
          action: 'status_change',
          metadata: { from: existing.status, to: d.status },
        },
      }),
    );
    historyOps.push(
      prisma.activityEvent.create({
        data: {
          organizationId: ctx.organizationId,
          actorId: ctx.user.id,
          kind: `task.${d.status?.toLowerCase()}`,
          summary: `${ctx.user.name ?? ctx.user.email} moved "${existing.title}" to ${d.status}`,
          data: { taskId: id, from: existing.status, to: d.status },
        },
      }),
    );
  }
  if (d.assigneeId !== undefined && d.assigneeId !== existing.assigneeId) {
    historyOps.push(
      prisma.taskHistory.create({
        data: {
          taskId: id,
          actorId: ctx.user.id,
          action: 'assigned',
          metadata: { from: existing.assigneeId, to: d.assigneeId },
        },
      }),
    );
  }
  if (historyOps.length) await prisma.$transaction(historyOps);

  await logAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: 'task.update',
    entity: 'Task',
    entityId: id,
    metadata: d,
  });

  return ok({ task: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireOrgContext('MANAGER');
  if (!ctx.ok) return ctx.response;

  const existing = await prisma.task.findFirst({
    where: { id, organizationId: ctx.organizationId, deletedAt: null },
  });
  if (!existing) return fail('Task not found', 404);

  await prisma.task.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await logAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: 'task.delete',
    entity: 'Task',
    entityId: id,
  });

  return ok({ deleted: true });
}
