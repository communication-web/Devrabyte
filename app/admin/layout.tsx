import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { Shield } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.isSuperAdmin) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4" />
            Devrabyte admin
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">Overview</Link>
            <Link href="/admin/organizations" className="hover:text-foreground">Organizations</Link>
            <Link href="/admin/audit" className="hover:text-foreground">Audit</Link>
            <Link href="/dashboard" className="hover:text-foreground">Exit</Link>
          </nav>
        </div>
      </header>
      <main className="container py-10">{children}</main>
    </div>
  );
}
