'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/badge';
import { QuickAddDialog } from '@/components/tasks/quick-add-dialog';

export function Topbar({
  userName,
  userEmail,
}: {
  userName: string | null;
  userEmail: string;
}) {
  const [quickOpen, setQuickOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setQuickOpen(true)}
          className="group flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Sparkles className="h-4 w-4" />
          <span>Quick add with AI</span>
          <kbd className="ml-2 hidden rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground group-hover:inline-block">
            ⌘K
          </kbd>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setQuickOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New task
        </Button>
        <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
          <Avatar name={userName ?? userEmail} size={24} />
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium leading-none">{userName ?? 'You'}</p>
            <p className="text-[10px] text-muted-foreground">{userEmail}</p>
          </div>
        </div>
      </div>
      <QuickAddDialog open={quickOpen} onOpenChange={setQuickOpen} />
    </header>
  );
}
