import { AlertTriangle } from 'lucide-react';
import { requireOrg } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatRelative } from '@/lib/utils';
import { ScanButton, AckButton } from './actions';

export default async function BottlenecksPage() {
  const { organization } = await requireOrg();

  const alerts = await prisma.alert.findMany({
    where: { organizationId: organization.id },
    orderBy: [{ acknowledgedAt: 'asc' }, { createdAt: 'desc' }],
    take: 50,
  });

  const open = alerts.filter((a) => !a.acknowledgedAt);
  const closed = alerts.filter((a) => a.acknowledgedAt);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Bottlenecks</p>
          <h1 className="font-display text-4xl tracking-tight">What's getting stuck</h1>
        </div>
        <ScanButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open alerts ({open.length})</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {open.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="h-5 w-5" />}
              title="No active bottlenecks"
              description="Run a scan to analyze the last 14 days of activity."
            />
          ) : (
            <div className="space-y-3">
              {open.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={a.severity === 'CRITICAL' ? 'danger' : a.severity === 'WARNING' ? 'warning' : 'info'}
                        className="capitalize"
                      >
                        {a.severity.toLowerCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatRelative(a.createdAt)}</span>
                    </div>
                    <p className="mt-2 font-medium">{a.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                  </div>
                  <AckButton id={a.id} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {closed.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Acknowledged ({closed.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {closed.slice(0, 20).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-b-0">
                  <div>
                    <p className="truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Acked {formatRelative(a.acknowledgedAt)}
                    </p>
                  </div>
                  <Badge variant="muted" className="capitalize">{a.severity.toLowerCase()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
