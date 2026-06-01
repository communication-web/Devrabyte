import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth/admin';
import { ok } from '@/lib/api';
import { subDays } from 'date-fns';

export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  const since24h = subDays(new Date(), 1);
  const since7d = subDays(new Date(), 7);

  const [
    orgs,
    users,
    activeOrgs7d,
    tasks,
    tasks24h,
    inbound24h,
    outbound24h,
    failedMessages24h,
    alertsOpen,
    paidInvoices30d,
  ] = await Promise.all([
    prisma.organization.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.activityEvent
      .groupBy({ by: ['organizationId'], where: { createdAt: { gte: since7d } } })
      .then((r) => r.length),
    prisma.task.count({ where: { deletedAt: null } }),
    prisma.task.count({ where: { createdAt: { gte: since24h } } }),
    prisma.message.count({ where: { direction: 'INBOUND', createdAt: { gte: since24h } } }),
    prisma.message.count({ where: { direction: 'OUTBOUND', createdAt: { gte: since24h } } }),
    prisma.message.count({
      where: { createdAt: { gte: since24h }, errorMessage: { not: null } },
    }),
    prisma.alert.count({ where: { acknowledgedAt: null } }),
    prisma.invoice.aggregate({
      where: { status: 'paid', paidAt: { gte: subDays(new Date(), 30) } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  return ok({
    health: {
      orgs,
      users,
      activeOrgs7d,
      tasks,
      tasks24h,
      inbound24h,
      outbound24h,
      failedMessages24h,
      alertsOpen,
      revenue30dKobo: paidInvoices30d._sum.amount ?? 0,
      paidInvoices30d: paidInvoices30d._count._all,
    },
  });
}
