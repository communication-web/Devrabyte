import { prisma } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelative } from '@/lib/utils';

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      actor: { select: { name: true, email: true } },
      organization: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Admin</p>
        <h1 className="font-display text-4xl tracking-tight">Audit log</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[140px_1fr_1fr_1fr_100px] gap-3 border-b border-border/60 bg-secondary/40 px-4 py-2.5 text-xs uppercase tracking-wide text-muted-foreground">
            <span>When</span>
            <span>Action</span>
            <span>Actor</span>
            <span>Organization</span>
            <span>Entity</span>
          </div>
          {logs.map((l) => (
            <div
              key={l.id}
              className="grid grid-cols-[140px_1fr_1fr_1fr_100px] gap-3 border-b border-border/60 px-4 py-2.5 text-sm last:border-b-0"
            >
              <span className="text-xs text-muted-foreground">{formatRelative(l.createdAt)}</span>
              <Badge variant="outline" className="w-fit text-xs">{l.action}</Badge>
              <span className="truncate text-xs">{l.actor?.name ?? l.actor?.email ?? '—'}</span>
              <span className="truncate text-xs">{l.organization?.name ?? '—'}</span>
              <span className="truncate text-xs text-muted-foreground">{l.entity}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
