import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth/admin';
import { ok } from '@/lib/api';

export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  const take = Math.min(Number(url.searchParams.get('limit') ?? '50'), 200);

  const orgs = await prisma.organization.findMany({
    where: {
      deletedAt: null,
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    },
    include: {
      subscription: true,
      _count: {
        select: {
          memberships: true,
          tasks: true,
          workflows: true,
          messages: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take,
  });

  // Compute simple health: has traffic in last 7d?
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const recent = await prisma.activityEvent.groupBy({
    by: ['organizationId'],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });
  const recentMap = Object.fromEntries(recent.map((r) => [r.organizationId, r._count._all]));

  return ok({
    organizations: orgs.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      plan: o.plan,
      industry: o.industry,
      trialEndsAt: o.trialEndsAt,
      createdAt: o.createdAt,
      counts: o._count,
      subscription: o.subscription,
      eventsLast7d: recentMap[o.id] ?? 0,
    })),
  });
}
