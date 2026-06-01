'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ListChecks,
  Workflow,
  Users,
  BarChart3,
  AlertTriangle,
  MessageCircle,
  Settings,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/workflows', label: 'Workflows', icon: Workflow },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/bottlenecks', label: 'Bottlenecks', icon: AlertTriangle },
  { href: '/whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

const BOTTOM_NAV = [
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ orgName, role }: { orgName: string; role: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden border-r border-border bg-card lg:flex lg:w-64 lg:flex-col">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-[10px] font-semibold">D</span>
          </span>
          <span className="font-medium tracking-tight">Devrabyte</span>
        </Link>
      </div>
      <div className="flex flex-col px-3 py-4">
        <div className="mb-3 rounded-md border border-border px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Workspace</p>
          <p className="mt-0.5 truncate text-sm font-medium">{orgName}</p>
          <p className="text-xs text-muted-foreground">{role.toLowerCase()}</p>
        </div>
        <nav className="space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto border-t border-border px-3 py-4">
        <nav className="space-y-0.5">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </aside>
  );
}
