import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOrgContext, readJson, ok, fail, logAudit } from '@/lib/api';
import { CreateTaskSchema } from '@/lib/validators/schemas';
import type { TaskStatus, TaskPriority } from '@prisma/client';

export async function GET(req: NextRequest) {
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;

  const url = new URL(req.url);
  const status = url.searchParams.get('status') as TaskStatus | null;
  const priority = url.searchParams.get('priority') as TaskPriority | null;
  const assigneeId = url.searchParams.get('assigneeId');
  const q = url.searchParams.get('q');
  const scope = url.searchParams.get('scope'); // 'overdue' | 'blocked' | 'due_today' | 'mine'
  const take = Math.min(Number(url.searchParams.get('limit') ?? '50'), 200);

  const where: any = { organizationId: ctx.organizationId, deletedAt: null };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;
  if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }];

  const now = new Date();
  if (scope === 'overdue') {
    where.dueAt = { lt: now };
    where.status = { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] };
  } else if (scope === 'blocked') {
    where.status = 'BLOCKED';
  } else if (scope === 'due_today') {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    where.dueAt = { gte: start, lte: end };
  } else if (scope === 'mine') {
    where.assigneeId = ctx.user.id;
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      createdBy: { select: { id: true, name: true } },
      workflow: { select: { id: true, name: true } },
      stage: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ dueAt: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    take,
  });
  return ok({ tasks });
}

export async function POST(req: NextRequest) {
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;

  const parsed = await readJson(req, CreateTaskSchema);
  if (!parsed.ok) return parsed.response;
  const d = parsed.data;

  // If an assignee is given, they must be a member of this org
  if (d.assigneeId) {
    const m = await prisma.membership.findUnique({
      where: { userId_organizationId: { userId: d.assigneeId, organizationId: ctx.organizationId } },
    });
    if (!m) return fail('Assignee is not a member of this organization', 422);
  }

  // If workflow/stage given, ensure they belong to this org
  if (d.workflowId) {
    const w = await prisma.workflow.findFirst({
      where: { id: d.workflowId, organizationId: ctx.organizationId, deletedAt: null },
      include: { stages: true },
    });
    if (!w) return fail('Invalid workflow', 422);
    if (d.stageId && !w.stages.find((s) => s.id === d.stageId)) {
      return fail('Invalid stage for workflow', 422);
    }
  }

  const task = await prisma.task.create({
    data: {
      organizationId: ctx.organizationId,
      createdById: ctx.user.id,
      title: d.title,
      description: d.description ?? null,
      assigneeId: d.assigneeId ?? null,
      workflowId: d.workflowId ?? null,
      stageId: d.stageId ?? null,
      dueAt: d.dueAt ? new Date(d.dueAt) : null,
      priority: d.priority,
      tags: d.tags,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      workflow: { select: { id: true, name: true } },
      stage: { select: { id: true, name: true } },
    },
  });

  await prisma.$transaction([
    prisma.taskHistory.create({
      data: { taskId: task.id, actorId: ctx.user.id, action: 'created', metadata: { title: task.title } },
    }),
    prisma.activityEvent.create({
      data: {
        organizationId: ctx.organizationId,
        actorId: ctx.user.id,
        kind: 'task.created',
        summary: `${ctx.user.name ?? ctx.user.email} created "${task.title}"`,
        data: { taskId: task.id },
      },
    }),
  ]);

  await logAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: 'task.create',
    entity: 'Task',
    entityId: task.id,
  });

  return ok({ task }, 201);
}
