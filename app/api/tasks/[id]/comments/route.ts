import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireOrgContext, readJson, ok, fail, logAudit } from '@/lib/api';

const CommentSchema = z.object({ body: z.string().min(1).max(4000) });

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;

  const parsed = await readJson(req, CommentSchema);
  if (!parsed.ok) return parsed.response;

  const task = await prisma.task.findFirst({
    where: { id, organizationId: ctx.organizationId, deletedAt: null },
  });
  if (!task) return fail('Task not found', 404);

  const comment = await prisma.taskComment.create({
    data: { taskId: id, authorId: ctx.user.id, body: parsed.data.body },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  await prisma.taskHistory.create({
    data: { taskId: id, actorId: ctx.user.id, action: 'commented', metadata: { commentId: comment.id } },
  });

  await logAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: 'task.comment',
    entity: 'Task',
    entityId: id,
  });

  return ok({ comment }, 201);
}
