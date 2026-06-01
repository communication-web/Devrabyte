'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LinkPhoneForm({ currentPhone }: { currentPhone: string | null }) {
  const router = useRouter();
  const [phone, setPhone] = useState(currentPhone ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(false);
    try {
      const resp = await fetch('/api/whatsapp/link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const json = await resp.json();
      if (!json.ok) setError(json.error ?? 'Failed');
      else {
        setOk(true);
        router.refresh();
        setTimeout(() => setOk(false), 2500);
      }
    } finally {
      setBusy(false);
    }
  }

  async function unlink() {
    setBusy(true);
    try {
      await fetch('/api/whatsapp/link', { method: 'DELETE' });
      setPhone('');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Phone number (E.164)</Label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+2348012345678"
          pattern="^\+[1-9]\d{6,14}$"
          required
          className="max-w-sm"
        />
        <p className="text-xs text-muted-foreground">
          Include the country code. Example: +234 for Nigeria, +254 for Kenya.
        </p>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-600">Linked. Send a message to your Devrabyte number to try it.</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          {currentPhone ? 'Update number' : 'Link number'}
        </Button>
        {currentPhone ? (
          <Button type="button" variant="outline" onClick={unlink} disabled={busy}>
            Unlink
          </Button>
        ) : null}
      </div>
    </form>
  );
}
