'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ScanButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [narrative, setNarrative] = useState<string | null>(null);

  async function scan() {
    setBusy(true);
    try {
      const resp = await fetch('/api/reports/bottlenecks?scan=1');
      const json = await resp.json();
      if (json.ok && json.data.narrative) setNarrative(json.data.narrative);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={scan} disabled={busy}>
        <Scan className="mr-1 h-4 w-4" />
        {busy ? 'Scanning…' : 'Run scan'}
      </Button>
      {narrative ? (
        <div className="max-w-md rounded-md border border-border bg-card p-3 text-xs leading-relaxed text-muted-foreground">
          {narrative}
        </div>
      ) : null}
    </div>
  );
}

export function AckButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function ack() {
    setBusy(true);
    try {
      await fetch('/api/reports/bottlenecks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button variant="outline" size="sm" onClick={ack} disabled={busy}>
      <Check className="mr-1 h-3.5 w-3.5" />
      Acknowledge
    </Button>
  );
}
