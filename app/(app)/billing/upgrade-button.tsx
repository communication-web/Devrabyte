'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function UpgradeButton({ plan }: { plan: string }) {
  const [loading, setLoading] = useState(false);
  async function go() {
    setLoading(true);
    try {
      const resp = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const json = await resp.json();
      if (json.ok && json.data.authorizationUrl) {
        window.location.href = json.data.authorizationUrl;
      }
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button className="mt-5 w-full" variant="outline" onClick={go} disabled={loading}>
      {loading ? 'Redirecting…' : `Switch to ${plan.toLowerCase()}`}
    </Button>
  );
}
