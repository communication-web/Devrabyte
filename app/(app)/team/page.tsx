import { requireOrg } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, Avatar } from '@/components/ui/badge';
import { InviteForm } from './invite-form';
import { formatRelative } from '@/lib/utils';

export default async function TeamPage() {
  const { organization, membership } = await requireOrg();

  const [members, invites, workload] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: organization.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, lastLoginAt: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.invite.findMany({
      where: { organizationId: organization.id, acceptedAt: null },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.task.groupBy({
      by: ['assigneeId'],
      where: {
        organizationId: organization.id,
        deletedAt: null,
        status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] },
      },
      _count: { _all: true },
    }),
  ]);

  const workloadMap = Object.fromEntries(workload.map((w) => [w.assigneeId ?? '', w._count._all]));
  const canAdmin = membership.role === 'OWNER' || membership.role === 'ADMIN';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Team</p>
        <h1 className="font-display text-4xl tracking-tight">Your team</h1>
      </div>

      {canAdmin ? <InviteForm /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-border/60">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={m.user.name ?? m.user.email} size={36} />
                  <div>
                    <p className="text-sm font-medium">{m.user.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{m.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {workloadMap[m.userId] ?? 0} open
                  </span>
                  <Badge variant="outline" className="capitalize">{m.role.toLowerCase()}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {invites.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Pending invites ({invites.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border/60">
              {invites.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm">{i.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited {formatRelative(i.createdAt)} · expires {formatRelative(i.expiresAt)}
                    </p>
                  </div>
                  <Badge variant="muted" className="capitalize">{i.role.toLowerCase()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
