'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge, Avatar } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { NewTaskDialog } from '@/components/tasks/new-task-dialog';
import { cn, formatDate, formatRelative } from '@/lib/utils';

type Task = {
  id: string;
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueAt: string | null;
  assignee: { id: string; name: string | null; email: string } | null;
  workflow: { id: string; name: string } | null;
  stage: { id: string; name: string } | null;
  _count: { comments: number };
};

type Member = { id: string; name: string | null; email: string };
type Workflow = { id: string; name: string; stages: { id: string; name: string; order: number }[] };

const SCOPES = [
  { key: 'all', label: 'All' },
  { key: 'due_today', label: 'Due today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'mine', label: 'Mine' },
];

export function TasksList({
  initialTasks,
  members,
  workflows,
  activeScope,
  query,
}: {
  initialTasks: Task[];
  members: Member[];
  workflows: Workflow[];
  activeScope: string;
  activeStatus?: string;
  query: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(query);
  const [showNew, setShowNew] = useState(false);

  function goTo(params: Record<string, string | undefined>) {
    const u = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(params)) {
      if (!v || v === 'all') u.delete(k);
      else u.set(k, v);
    }
    start(() => router.push(`/tasks?${u.toString()}`));
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-card p-1">
          {SCOPES.map((s) => (
            <button
              key={s.key}
              onClick={() => goTo({ scope: s.key, status: undefined })}
              className={cn(
                'rounded px-3 py-1.5 text-sm transition-colors',
                activeScope === s.key
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goTo({ q });
            }}
            className="relative"
          >
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tasks"
              className="h-9 w-56 pl-8"
            />
          </form>
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="mr-1 h-4 w-4" /> New task
          </Button>
        </div>
      </div>

      {initialTasks.length === 0 ? (
        <EmptyState
          title="No tasks here"
          description="Create your first task or change the filter."
          action={
            <Button onClick={() => setShowNew(true)}>
              <Plus className="mr-1 h-4 w-4" /> New task
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="grid grid-cols-[auto_1fr_140px_140px_140px_80px] items-center gap-3 border-b border-border bg-secondary/40 px-4 py-2.5 text-xs uppercase tracking-wide text-muted-foreground">
            <span className="w-5" />
            <span>Title</span>
            <span>Assignee</span>
            <span>Due</span>
            <span>Workflow</span>
            <span>Status</span>
          </div>
          {initialTasks.map((t) => (
            <Link
              key={t.id}
              href={`/tasks/${t.id}`}
              className="grid grid-cols-[auto_1fr_140px_140px_140px_80px] items-center gap-3 border-b border-border/60 px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-secondary/40"
            >
              <PriorityDot priority={t.priority} />
              <div className="min-w-0">
                <p className="truncate font-medium">{t.title}</p>
                {t.stage ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.stage.name}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {t.assignee ? (
                  <>
                    <Avatar name={t.assignee.name ?? t.assignee.email} size={20} />
                    <span className="truncate text-xs">{t.assignee.name ?? t.assignee.email}</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Unassigned</span>
                )}
              </div>
              <div className="text-xs">
                {t.dueAt ? (
                  <span
                    className={cn(
                      new Date(t.dueAt) < new Date() && !['DONE', 'CANCELED'].includes(t.status)
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-muted-foreground',
                    )}
                  >
                    {formatRelative(t.dueAt)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {t.workflow?.name ?? '—'}
              </div>
              <StatusBadge status={t.status} />
            </Link>
          ))}
        </div>
      )}

      <NewTaskDialog open={showNew} onOpenChange={setShowNew} members={members} workflows={workflows} />
    </>
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

function StatusBadge({ status }: { status: string }) {
  const v =
    status === 'DONE'
      ? 'success'
      : status === 'BLOCKED'
        ? 'warning'
        : status === 'IN_PROGRESS'
          ? 'info'
          : status === 'CANCELED'
            ? 'muted'
            : 'outline';
  const label = status.replace('_', ' ').toLowerCase();
  return (
    <Badge variant={v as any} className="capitalize">
      {label}
    </Badge>
  );
}
