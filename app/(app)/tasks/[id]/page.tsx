import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireOrg } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { TaskDetail } from './task-detail';

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await requireOrg();

  const task = await prisma.task.findFirst({
    where: { id, organizationId: organization.id, deletedAt: null },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      workflow: { include: { stages: { orderBy: { order: 'asc' } } } },
      stage: true,
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, name: true, email: true } } },
      },
      history: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  });
  if (!task) notFound();

  const members = await prisma.membership.findMany({
    where: { organizationId: organization.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/tasks">
          <ArrowLeft className="mr-1 h-4 w-4" /> All tasks
        </Link>
      </Button>
      <TaskDetail task={task as any} members={members.map((m) => m.user)} />
    </div>
  );
}
