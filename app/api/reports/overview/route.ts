import { prisma } from '@/lib/db';
import { requireOrgContext, ok } from '@/lib/api';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function GET() {
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const [
    openCount,
    overdueCount,
    blockedCount,
    dueToday,
    completedToday,
    completed7d,
    activity,
    recentAlerts,
  ] = await Promise.all([
    prisma.task.count({
      where: { organizationId: ctx.organizationId, deletedAt: null, status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] } },
    }),
    prisma.task.count({
      where: {
        organizationId: ctx.organizationId,
        deletedAt: null,
        dueAt: { lt: now },
        status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] },
      },
    }),
    prisma.task.count({
      where: { organizationId: ctx.organizationId, deletedAt: null, status: 'BLOCKED' },
    }),
    prisma.task.findMany({
      where: {
        organizationId: ctx.organizationId,
        deletedAt: null,
        dueAt: { gte: dayStart, lte: dayEnd },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      include: { assignee: { select: { id: true, name: true } } },
      orderBy: { priority: 'desc' },
      take: 10,
    }),
    prisma.task.count({
      where: { organizationId: ctx.organizationId, completedAt: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.task.count({
      where: { organizationId: ctx.organizationId, completedAt: { gte: subDays(now, 7) } },
    }),
    prisma.activityEvent.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: { actor: { select: { name: true, email: true } } },
    }),
    prisma.alert.findMany({
      where: { organizationId: ctx.organizationId, acknowledgedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return ok({
    kpis: {
      openCount,
      overdueCount,
      blockedCount,
      completedToday,
      completed7d,
      dueTodayCount: dueToday.length,
    },
    dueToday,
    activity,
    alerts: recentAlerts,
  });
}
