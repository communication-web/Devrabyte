import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const membership = user.memberships[0];
  if (!membership) redirect('/onboarding');

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar orgName={membership.organization.name} role={membership.role} />
      <div className="flex flex-1 flex-col">
        <Topbar userName={user.name} userEmail={user.email} />
        <main className="flex-1 overflow-x-hidden px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
