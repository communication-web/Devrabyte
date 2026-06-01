'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ImportTemplateButton({ templateKey, name }: { templateKey: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    try {
      await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, templateKey, stages: [] }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" className="mt-4 w-full" onClick={go} disabled={loading}>
      <Plus className="mr-1 h-3.5 w-3.5" />
      {loading ? 'Importing…' : 'Import template'}
    </Button>
  );
}
