import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelative } from '@/lib/utils';
import { subDays } from 'date-fns';

export default async function AdminOrgsPage() {
  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null },
    include: {
      subscription: true,
      _count: { select: { memberships: true, tasks: true, workflows: true, messages: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const since = subDays(new Date(), 7);
  const recent = await prisma.activityEvent.groupBy({
    by: ['organizationId'],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });
  const recentMap = Object.fromEntries(recent.map((r) => [r.organizationId, r._count._all]));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Admin</p>
        <h1 className="font-display text-4xl tracking-tight">Organizations ({orgs.length})</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_100px_80px_80px_80px_120px_100px] items-center gap-3 border-b border-border/60 bg-secondary/40 px-4 py-2.5 text-xs uppercase tracking-wide text-muted-foreground">
            <span>Organization</span>
            <span>Plan</span>
            <span>Users</span>
            <span>Tasks</span>
            <span>WA</span>
            <span>Activity 7d</span>
            <span>Created</span>
          </div>
          {orgs.map((o) => (
            <div
              key={o.id}
              className="grid grid-cols-[1fr_100px_80px_80px_80px_120px_100px] items-center gap-3 border-b border-border/60 px-4 py-3 text-sm last:border-b-0 hover:bg-secondary/30"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{o.name}</p>
                <p className="truncate text-xs text-muted-foreground">{o.slug} · {o.industry ?? '—'}</p>
              </div>
              <Badge variant={o.plan === 'TRIAL' ? 'warning' : 'success'} className="w-fit capitalize">
                {o.plan.toLowerCase()}
              </Badge>
              <span className="tabular text-xs">{o._count.memberships}</span>
              <span className="tabular text-xs">{o._count.tasks}</span>
              <span className="tabular text-xs">{o._count.messages}</span>
              <span className="tabular text-xs">{recentMap[o.id] ?? 0}</span>
              <span className="text-xs text-muted-foreground">{formatRelative(o.createdAt)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
