import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { WORKFLOW_TEMPLATES } from '@/lib/workflows/templates';
import { OnboardingFlow } from './onboarding-flow';

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const membership = user.memberships[0];
  if (!membership) redirect('/login');

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-14">
        <div className="mb-8 flex items-center gap-2 text-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-[10px] font-semibold">D</span>
          </span>
          <span className="font-medium">Devrabyte AI Ops</span>
        </div>
        <OnboardingFlow orgName={membership.organization.name} templates={WORKFLOW_TEMPLATES} />
      </div>
    </div>
  );
}
