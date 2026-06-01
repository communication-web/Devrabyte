'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-6xl tracking-tight">something broke</p>
      <p className="mt-4 max-w-md text-sm text-muted-foreground">
        We hit an unexpected error. It's been logged. You can try again below.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">ref: {error.digest}</p>
      ) : null}
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <a href="/dashboard">Go to dashboard</a>
        </Button>
      </div>
    </div>
  );
}
