'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function QuickAddDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [reply, setReply] = useState<string | null>(null);

  async function parse(execute: boolean) {
    setLoading(true);
    setReply(null);
    try {
      const resp = await fetch('/api/ai/quick-parse', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, execute }),
      });
      const json = await resp.json();
      if (json.ok) {
        setPreview(json.data.intent);
        setReply(json.data.reply);
        if (execute) {
          setText('');
          setPreview(null);
          router.refresh();
          setTimeout(() => onOpenChange(false), 600);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/4 z-50 w-full max-w-xl -translate-x-1/2 rounded-xl border border-border bg-card p-6 shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" /> Quick add with AI
            </div>
            <Dialog.Close className="rounded-md p-1 text-muted-foreground hover:bg-secondary">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Type what you want to do, in plain English.
          </p>
          <Textarea
            className="mt-4 min-h-[96px]"
            placeholder='e.g. "Assign Mary to follow up with ABC Ltd tomorrow 10am, high priority"'
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {preview ? (
            <div className="mt-3 rounded-md border border-border bg-background p-3 text-xs">
              <p className="mb-2 font-medium">AI interpretation</p>
              <dl className="grid grid-cols-[110px_1fr] gap-y-1 tabular">
                <dt className="text-muted-foreground">Intent</dt>
                <dd>{preview.intent}</dd>
                {preview.task_title && (
                  <>
                    <dt className="text-muted-foreground">Task</dt>
                    <dd>{preview.task_title}</dd>
                  </>
                )}
                {preview.assignee_name && (
                  <>
                    <dt className="text-muted-foreground">Assignee</dt>
                    <dd>{preview.assignee_name}</dd>
                  </>
                )}
                {preview.due_date_iso && (
                  <>
                    <dt className="text-muted-foreground">Due</dt>
                    <dd>{new Date(preview.due_date_iso).toLocaleString()}</dd>
                  </>
                )}
                {preview.priority && (
                  <>
                    <dt className="text-muted-foreground">Priority</dt>
                    <dd>{preview.priority}</dd>
                  </>
                )}
              </dl>
            </div>
          ) : null}
          {reply ? (
            <div className="mt-3 rounded-md bg-muted p-3 text-sm">{reply}</div>
          ) : null}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => parse(false)} disabled={loading || !text.trim()}>
              Preview
            </Button>
            <Button onClick={() => parse(true)} disabled={loading || !text.trim()}>
              {loading ? 'Working…' : 'Create'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
