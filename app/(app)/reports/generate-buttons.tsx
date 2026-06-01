'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export function GenerateReportButtons() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function gen(kind: 'daily' | 'weekly') {
    setBusy(kind);
    try {
      await fetch(`/api/reports/${kind}?generate=1`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => gen('daily')} disabled={!!busy}>
        <Sparkles className="mr-1 h-3.5 w-3.5" />
        {busy === 'daily' ? 'Generating…' : 'Generate daily'}
      </Button>
      <Button variant="outline" size="sm" onClick={() => gen('weekly')} disabled={!!busy}>
        <Sparkles className="mr-1 h-3.5 w-3.5" />
        {busy === 'weekly' ? 'Generating…' : 'Generate weekly'}
      </Button>
    </div>
  );
}
