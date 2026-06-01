'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLink(null);
    try {
      const resp = await fetch('/api/organizations/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const json = await resp.json();
      if (!json.ok) {
        setError(json.error ?? 'Failed');
      } else {
        setLink(json.data.inviteUrl ?? null);
        setEmail('');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Invite a team member
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="teammate@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="sm:flex-1"
          />
          <Select value={role} onChange={(e) => setRole(e.target.value)} className="sm:w-40">
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="MEMBER">Member</option>
          </Select>
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send invite'}
          </Button>
        </form>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        {link ? (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-xs">
            <span className="flex-1 truncate">{link}</span>
            <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(link)}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
