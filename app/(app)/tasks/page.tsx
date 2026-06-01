import Link from 'next/link';
import { requireOrg } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { TasksList } from './tasks-list';

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { organization, user } = await requireOrg();
  const sp = await searchParams;

  const scope = sp.scope; // overdue | blocked | due_today | mine
  const status = sp.status as any;
  const q = sp.q ?? '';

  const where: any = { organizationId: organization.id, deletedAt: null };
  if (status) where.status = status;
  if (q) where.title = { contains: q, mode: 'insensitive' };

  const now = new Date();
  if (scope === 'overdue') {
    where.dueAt = { lt: now };
    where.status = { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] };
  } else if (scope === 'blocked') {
    where.status = 'BLOCKED';
  } else if (scope === 'due_today') {
    const s = new Date(now); s.setHours(0, 0, 0, 0);
    const e = new Date(now); e.setHours(23, 59, 59, 999);
    where.dueAt = { gte: s, lte: e };
  } else if (scope === 'mine') {
    where.assigneeId = user.id;
  }

  const [tasks, members, workflows] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        workflow: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ dueAt: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    }),
    prisma.membership.findMany({
      where: { organizationId: organization.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.workflow.findMany({
      where: { organizationId: organization.id, deletedAt: null, isActive: true },
      include: { stages: { orderBy: { order: 'asc' } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Tasks</p>
          <h1 className="font-display text-4xl tracking-tight">
            {scope === 'overdue'
              ? 'Overdue'
              : scope === 'blocked'
                ? 'Blocked'
                : scope === 'due_today'
                  ? 'Due today'
                  : 'All tasks'}
          </h1>
        </div>
      </div>
      <TasksList
        initialTasks={tasks as any}
        members={members.map((m) => m.user)}
        workflows={workflows as any}
        activeScope={scope ?? 'all'}
        activeStatus={status}
        query={q}
      />
    </div>
  );
}
