import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { subDays } from 'date-fns';

export default async function AdminHome() {
  const since24h = subDays(new Date(), 1);
  const since7d = subDays(new Date(), 7);

  const [orgs, users, tasks, tasks24h, inbound24h, outbound24h, failed24h, alertsOpen, paid30d, activeOrgs7d] =
    await Promise.all([
      prisma.organization.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.task.count({ where: { deletedAt: null } }),
      prisma.task.count({ where: { createdAt: { gte: since24h } } }),
      prisma.message.count({ where: { direction: 'INBOUND', createdAt: { gte: since24h } } }),
      prisma.message.count({ where: { direction: 'OUTBOUND', createdAt: { gte: since24h } } }),
      prisma.message.count({ where: { createdAt: { gte: since24h }, errorMessage: { not: null } } }),
      prisma.alert.count({ where: { acknowledgedAt: null } }),
      prisma.invoice.aggregate({
        where: { status: 'paid', paidAt: { gte: subDays(new Date(), 30) } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.activityEvent.groupBy({ by: ['organizationId'], where: { createdAt: { gte: since7d } } }).then((r) => r.length),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Platform</p>
        <h1 className="font-display text-4xl tracking-tight">Overview</h1>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Organizations" value={orgs} />
        <Stat label="Users" value={users} />
        <Stat label="Tasks (total)" value={tasks} />
        <Stat label="Active orgs (7d)" value={activeOrgs7d} />
        <Stat label="Tasks created (24h)" value={tasks24h} />
        <Stat label="WhatsApp in (24h)" value={inbound24h} />
        <Stat label="WhatsApp out (24h)" value={outbound24h} />
        <Stat label="Failed messages (24h)" value={failed24h} accent={failed24h > 0 ? 'warning' : undefined} />
        <Stat label="Open alerts" value={alertsOpen} />
        <Stat label="Paid invoices (30d)" value={paid30d._count._all} />
        <Stat
          label="Revenue (30d)"
          value={`₦${((paid30d._sum.amount ?? 0) / 100).toLocaleString()}`}
          accent="success"
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: 'success' | 'warning' | 'danger';
}) {
  const cls =
    accent === 'success'
      ? 'text-emerald-600'
      : accent === 'warning'
        ? 'text-amber-600'
        : accent === 'danger'
          ? 'text-rose-600'
          : '';
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-2 font-display text-3xl tabular ${cls}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
