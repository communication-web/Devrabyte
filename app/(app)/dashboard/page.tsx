import Link from 'next/link';
import { ArrowRight, AlertTriangle, CheckCircle2, Clock, Ban, ListChecks } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, Avatar } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatRelative } from '@/lib/utils';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  const membership = user.memberships[0];
  const orgId = membership.organizationId;

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const [kpis, dueToday, activity, alerts] = await Promise.all([
    Promise.all([
      prisma.task.count({ where: { organizationId: orgId, deletedAt: null, status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] } } }),
      prisma.task.count({
        where: {
          organizationId: orgId,
          deletedAt: null,
          dueAt: { lt: now },
          status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] },
        },
      }),
      prisma.task.count({ where: { organizationId: orgId, deletedAt: null, status: 'BLOCKED' } }),
      prisma.task.count({ where: { organizationId: orgId, completedAt: { gte: dayStart, lte: dayEnd } } }),
      prisma.task.count({ where: { organizationId: orgId, completedAt: { gte: subDays(now, 7) } } }),
    ]),
    prisma.task.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        dueAt: { gte: dayStart, lte: dayEnd },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      include: { assignee: { select: { id: true, name: true } } },
      orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }],
      take: 8,
    }),
    prisma.activityEvent.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { actor: { select: { name: true, email: true } } },
    }),
    prisma.alert.findMany({
      where: { organizationId: orgId, acknowledgedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ]);

  const [open, overdue, blocked, completedToday, completed7d] = kpis;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Today at {membership.organization.name}
          </p>
          <h1 className="font-display text-4xl tracking-tight">
            {greeting}, {user.name?.split(' ')[0] ?? 'there'}
          </h1>
        </div>
        <div className="text-sm text-muted-foreground">
          {completedToday > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {completedToday} win{completedToday === 1 ? '' : 's'} today
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
              Nothing completed today yet
            </span>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-5">
        <Kpi label="Open" value={open} icon={<ListChecks className="h-4 w-4" />} />
        <Kpi
          label="Due today"
          value={dueToday.length}
          icon={<Clock className="h-4 w-4" />}
          accent={dueToday.length > 0 ? 'info' : undefined}
        />
        <Kpi
          label="Overdue"
          value={overdue}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent={overdue > 0 ? 'danger' : undefined}
        />
        <Kpi label="Blocked" value={blocked} icon={<Ban className="h-4 w-4" />} accent={blocked > 0 ? 'warning' : undefined} />
        <Kpi label="Done (7d)" value={completed7d} icon={<CheckCircle2 className="h-4 w-4" />} accent="success" />
      </div>

      {/* Alerts */}
      {alerts.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" /> Bottleneck alerts
              </CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/bottlenecks">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-background p-3">
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
                </div>
                <Badge variant={a.severity === 'CRITICAL' ? 'danger' : a.severity === 'WARNING' ? 'warning' : 'info'}>
                  {a.severity.toLowerCase()}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Due today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Due today</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/tasks?scope=due_today">
                All tasks <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {dueToday.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Nothing due today"
                description="You're clear. Use this time to tackle overdue or upcoming work."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/tasks?scope=overdue">View overdue</Link>
                  </Button>
                }
              />
            ) : (
              <div className="divide-y divide-border/60">
                {dueToday.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tasks/${t.id}`}
                    className="flex items-center justify-between gap-4 py-3 text-sm transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <PriorityDot priority={t.priority} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{t.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.dueAt ? new Date(t.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          {t.assignee ? ` · ${t.assignee.name}` : ' · unassigned'}
                        </p>
                      </div>
                    </div>
                    <Avatar name={t.assignee?.name ?? '?'} size={24} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {activity.length === 0 ? (
              <EmptyState title="No activity yet" description="Assign a task to get started." />
            ) : (
              <ul className="space-y-3 text-sm">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <Avatar name={a.actor?.name ?? a.actor?.email ?? '?'} size={24} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{a.summary}</p>
                      <p className="text-xs text-muted-foreground">{formatRelative(a.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: 'info' | 'success' | 'warning' | 'danger';
}) {
  const accentCls =
    accent === 'danger'
      ? 'text-rose-600 dark:text-rose-400'
      : accent === 'warning'
        ? 'text-amber-600 dark:text-amber-400'
        : accent === 'success'
          ? 'text-emerald-600 dark:text-emerald-400'
          : accent === 'info'
            ? 'text-sky-600 dark:text-sky-400'
            : '';
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wide">{label}</span>
        <span>{icon}</span>
      </div>
      <p className={`mt-2 font-display text-3xl tabular ${accentCls}`}>{value}</p>
    </div>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const color =
    priority === 'URGENT'
      ? 'bg-rose-500'
      : priority === 'HIGH'
        ? 'bg-amber-500'
        : priority === 'MEDIUM'
          ? 'bg-sky-500'
          : 'bg-neutral-400';
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${color}`} />;
}
