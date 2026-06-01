import { requireOrg } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { GenerateReportButtons } from './generate-buttons';
import { formatRelative } from '@/lib/utils';
import { subDays, startOfDay } from 'date-fns';

export default async function ReportsPage() {
  const { organization } = await requireOrg();

  const [daily, weekly, workload] = await Promise.all([
    prisma.report.findMany({
      where: { organizationId: organization.id, kind: 'daily' },
      orderBy: { createdAt: 'desc' },
      take: 7,
    }),
    prisma.report.findMany({
      where: { organizationId: organization.id, kind: 'weekly' },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    (async () => {
      const since = subDays(startOfDay(new Date()), 30);
      const [members, openBy, doneBy, overdueBy] = await Promise.all([
        prisma.membership.findMany({
          where: { organizationId: organization.id },
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
        prisma.task.groupBy({
          by: ['assigneeId'],
          where: { organizationId: organization.id, deletedAt: null, status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] } },
          _count: { _all: true },
        }),
        prisma.task.groupBy({
          by: ['assigneeId'],
          where: { organizationId: organization.id, completedAt: { gte: since } },
          _count: { _all: true },
        }),
        prisma.task.groupBy({
          by: ['assigneeId'],
          where: {
            organizationId: organization.id,
            deletedAt: null,
            dueAt: { lt: new Date() },
            status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] },
          },
          _count: { _all: true },
        }),
      ]);
      const om = Object.fromEntries(openBy.map((r) => [r.assigneeId ?? '', r._count._all]));
      const dm = Object.fromEntries(doneBy.map((r) => [r.assigneeId ?? '', r._count._all]));
      const xm = Object.fromEntries(overdueBy.map((r) => [r.assigneeId ?? '', r._count._all]));
      return members.map((m) => ({
        id: m.userId,
        name: m.user.name ?? m.user.email,
        open: om[m.userId] ?? 0,
        overdue: xm[m.userId] ?? 0,
        done30: dm[m.userId] ?? 0,
      })).sort((a, b) => b.open - a.open);
    })(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Reports</p>
          <h1 className="font-display text-4xl tracking-tight">Operations reports</h1>
        </div>
        <GenerateReportButtons />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily summaries</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {daily.length === 0 ? (
              <EmptyState title="No daily summaries yet" description="Generate one above." />
            ) : (
              <div className="space-y-3">
                {daily.map((r) => (
                  <details key={r.id} className="rounded-md border border-border/60 bg-background/60 p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      {new Date(r.periodStart).toLocaleDateString('en-GB', { dateStyle: 'full' })}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatRelative(r.createdAt)}
                      </span>
                    </summary>
                    <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                      {r.summary}
                    </pre>
                  </details>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly recaps</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {weekly.length === 0 ? (
              <EmptyState title="No weekly recaps yet" description="Generate one above." />
            ) : (
              <div className="space-y-3">
                {weekly.map((r) => (
                  <details key={r.id} className="rounded-md border border-border/60 bg-background/60 p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      Week of {new Date(r.periodStart).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                    </summary>
                    <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                      {r.summary}
                    </pre>
                  </details>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team workload</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-hidden rounded-md border border-border/60">
            <div className="grid grid-cols-4 border-b border-border/60 bg-secondary/40 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">
              <span>Member</span>
              <span>Open</span>
              <span>Overdue</span>
              <span>Done (30d)</span>
            </div>
            {workload.map((w) => (
              <div key={w.id} className="grid grid-cols-4 border-b border-border/60 px-4 py-3 text-sm last:border-b-0">
                <span className="truncate">{w.name}</span>
                <span className="tabular">{w.open}</span>
                <span className={`tabular ${w.overdue > 0 ? 'text-rose-600' : ''}`}>{w.overdue}</span>
                <span className="tabular">{w.done30}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
