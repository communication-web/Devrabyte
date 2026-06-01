import { prisma } from '@/lib/db';
import { requireOrgContext, ok } from '@/lib/api';
import { subDays, startOfDay } from 'date-fns';

export async function GET() {
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;

  const since = subDays(startOfDay(new Date()), 30);

  const [members, openByAssignee, completedByAssignee, overdueByAssignee] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: ctx.organizationId },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.task.groupBy({
      by: ['assigneeId'],
      where: {
        organizationId: ctx.organizationId,
        deletedAt: null,
        status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] },
      },
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ['assigneeId'],
      where: {
        organizationId: ctx.organizationId,
        completedAt: { gte: since },
      },
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ['assigneeId'],
      where: {
        organizationId: ctx.organizationId,
        deletedAt: null,
        dueAt: { lt: new Date() },
        status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] },
      },
      _count: { _all: true },
    }),
  ]);

  const openMap = Object.fromEntries(openByAssignee.map((r) => [r.assigneeId ?? '', r._count._all]));
  const doneMap = Object.fromEntries(completedByAssignee.map((r) => [r.assigneeId ?? '', r._count._all]));
  const overdueMap = Object.fromEntries(overdueByAssignee.map((r) => [r.assigneeId ?? '', r._count._all]));

  const rows = members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    open: openMap[m.userId] ?? 0,
    overdue: overdueMap[m.userId] ?? 0,
    completed30d: doneMap[m.userId] ?? 0,
  }));

  // Sort by workload desc
  rows.sort((a, b) => b.open - a.open);

  return ok({ workload: rows });
}
