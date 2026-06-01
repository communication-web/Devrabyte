'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

type Member = { id: string; name: string | null; email: string };
type Workflow = { id: string; name: string; stages: { id: string; name: string; order: number }[] };

export function NewTaskDialog({
  open,
  onOpenChange,
  members,
  workflows,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  members: Member[];
  workflows: Workflow[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    workflowId: '',
    stageId: '',
    dueAt: '',
    priority: 'MEDIUM',
  });
  const [loading, setLoading] = useState(false);
  const stages = workflows.find((w) => w.id === form.workflowId)?.stages ?? [];

  async function submit() {
    setLoading(true);
    try {
      const body: any = {
        title: form.title,
        description: form.description || undefined,
        assigneeId: form.assigneeId || undefined,
        workflowId: form.workflowId || undefined,
        stageId: form.stageId || undefined,
        priority: form.priority,
      };
      if (form.dueAt) body.dueAt = new Date(form.dueAt).toISOString();
      const resp = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (resp.ok) {
        setForm({
          title: '',
          description: '',
          assigneeId: '',
          workflowId: '',
          stageId: '',
          dueAt: '',
          priority: 'MEDIUM',
        });
        onOpenChange(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/4 z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-border bg-card p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-medium">New task</Dialog.Title>
            <Dialog.Close className="rounded-md p-1 text-muted-foreground hover:bg-secondary">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What needs to happen?"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Assignee</Label>
                <Select
                  value={form.assigneeId}
                  onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name ?? m.email}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Due</Label>
                <Input
                  type="datetime-local"
                  value={form.dueAt}
                  onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Workflow</Label>
                <Select
                  value={form.workflowId}
                  onChange={(e) => setForm({ ...form, workflowId: e.target.value, stageId: '' })}
                >
                  <option value="">None</option>
                  {workflows.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </Select>
              </div>
              {stages.length ? (
                <div className="col-span-2 space-y-1.5">
                  <Label>Stage</Label>
                  <Select
                    value={form.stageId}
                    onChange={(e) => setForm({ ...form, stageId: e.target.value })}
                  >
                    <option value="">— Choose stage —</option>
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={loading || !form.title.trim()}>
              {loading ? 'Creating…' : 'Create task'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
