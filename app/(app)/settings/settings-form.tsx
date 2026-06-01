'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

export function SettingsForm({ initial }: { initial: { name: string; industry: string; teamSize: string; timezone: string; dailySummaryAt: string } }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      const resp = await fetch('/api/organizations/current', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (resp.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Industry</Label>
          <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Team size</Label>
          <Input value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Timezone</Label>
          <Select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
            <option>Africa/Lagos</option>
            <option>Africa/Accra</option>
            <option>Africa/Nairobi</option>
            <option>Africa/Johannesburg</option>
            <option>Africa/Cairo</option>
            <option>Europe/London</option>
            <option>America/New_York</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Daily summary time</Label>
          <Input
            type="time"
            value={form.dailySummaryAt}
            onChange={(e) => setForm({ ...form, dailySummaryAt: e.target.value })}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save changes'}
        </Button>
        {saved ? <span className="text-sm text-emerald-600">Saved.</span> : null}
      </div>
    </form>
  );
}
