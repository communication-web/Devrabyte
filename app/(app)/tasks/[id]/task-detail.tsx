'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, Avatar } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { cn, formatDate, formatRelative } from '@/lib/utils';

const STATUSES = ['PENDING', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELED'] as const;

export function TaskDetail({ task, members }: { task: any; members: { id: string; name: string | null; email: string }[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(task.status);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  async function patch(data: any) {
    setBusy(true);
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function postComment() {
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: comment }),
      });
      setComment('');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Main */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <PriorityBadge priority={task.priority} />
                  {task.workflow ? <span>{task.workflow.name}</span> : null}
                  {task.stage ? <span>· {task.stage.name}</span> : null}
                </div>
                <CardTitle className="mt-2 text-2xl tracking-tight">{task.title}</CardTitle>
              </div>
              <StatusSwitcher
                current={status}
                onChange={(s) => {
                  setStatus(s);
                  patch({ status: s });
                }}
                disabled={busy}
              />
            </div>
          </CardHeader>
          <CardContent>
            {task.description ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {task.description}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground">No description.</p>
            )}
            {task.blockedReason && task.status === 'BLOCKED' ? (
              <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                <p className="text-xs font-medium uppercase tracking-wide">Blocked reason</p>
                <p className="mt-1">{task.blockedReason}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {task.comments.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">No comments yet.</p>
            ) : (
              <ul className="space-y-4">
                {task.comments.map((c: any) => (
                  <li key={c.id} className="flex gap-3">
                    <Avatar name={c.author.name ?? c.author.email} size={28} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium">{c.author.name ?? c.author.email}</span>
                        <span className="text-muted-foreground">{formatRelative(c.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm">{c.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2 pt-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment…"
                rows={2}
              />
              <Button onClick={postComment} disabled={busy || !comment.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <Card>
          <CardContent className="p-5 text-sm">
            <dl className="space-y-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Assignee</dt>
                <dd className="mt-1">
                  <Select
                    value={task.assigneeId ?? ''}
                    onChange={(e) => patch({ assigneeId: e.target.value || null })}
                    disabled={busy}
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name ?? m.email}
                      </option>
                    ))}
                  </Select>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Due</dt>
                <dd className="mt-1 tabular">{task.dueAt ? formatDate(task.dueAt) : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Created by</dt>
                <dd className="mt-1">{task.createdBy.name ?? task.createdBy.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Created</dt>
                <dd className="mt-1 text-muted-foreground">{formatRelative(task.createdAt)}</dd>
              </div>
              {task.completedAt ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Completed</dt>
                  <dd className="mt-1 text-muted-foreground">{formatRelative(task.completedAt)}</dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">History</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {task.history.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">No history yet.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {task.history.map((h: any) => (
                  <li key={h.id} className="border-l-2 border-border pl-3">
                    <p className="font-medium capitalize">{h.action.replace('_', ' ')}</p>
                    <p className="text-muted-foreground">{formatRelative(h.createdAt)}</p>
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

function StatusSwitcher({
  current,
  onChange,
  disabled,
}: {
  current: string;
  onChange: (s: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-md border border-border bg-card p-1">
      {STATUSES.map((s) => (
        <button
          key={s}
          disabled={disabled}
          onClick={() => onChange(s)}
          className={cn(
            'rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors',
            current === s ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary',
          )}
        >
          {s.replace('_', ' ').toLowerCase()}
        </button>
      ))}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const v =
    priority === 'URGENT' ? 'danger' : priority === 'HIGH' ? 'warning' : priority === 'LOW' ? 'muted' : 'info';
  return (
    <Badge variant={v as any} className="capitalize">
      {priority.toLowerCase()}
    </Badge>
  );
}
