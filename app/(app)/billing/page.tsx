import { Check } from 'lucide-react';
import { requireOrg } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PLANS } from '@/lib/billing/paystack';
import { formatRelative } from '@/lib/utils';
import { UpgradeButton } from './upgrade-button';

export default async function BillingPage() {
  const { organization, membership } = await requireOrg();
  const [subscription, invoices] = await Promise.all([
    prisma.subscription.findUnique({ where: { organizationId: organization.id } }),
    prisma.invoice.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
  ]);

  const isOwner = membership.role === 'OWNER';
  const currentPlan = organization.plan;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Billing</p>
        <h1 className="font-display text-4xl tracking-tight">Plan & payments</h1>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Current plan</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {organization.plan === 'TRIAL'
                ? `Trial ends ${organization.trialEndsAt ? formatRelative(organization.trialEndsAt) : 'soon'}`
                : subscription?.currentPeriodEnd
                  ? `Renews ${formatRelative(subscription.currentPeriodEnd)}`
                  : 'Active'}
            </p>
          </div>
          <Badge variant={organization.plan === 'TRIAL' ? 'warning' : 'success'} className="capitalize">
            {organization.plan.toLowerCase()}
          </Badge>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {(['STARTER', 'GROWTH', 'PRO'] as const).map((k) => {
          const p = PLANS[k];
          const isCurrent = currentPlan === k;
          const features: Record<string, string[]> = {
            STARTER: ['Up to 5 users', '500 tasks / month', 'WhatsApp integration', 'Daily summaries'],
            GROWTH: ['Up to 20 users', '3,000 tasks / month', 'All workflows', 'Bottleneck detection'],
            PRO: ['Up to 75 users', 'Unlimited tasks', 'Advanced analytics', 'Dedicated success manager'],
          };
          return (
            <Card key={k} className={isCurrent ? 'border-foreground' : ''}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium">{p.name}</h3>
                  {isCurrent ? <Badge variant="success">Current</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                <p className="mt-4 font-display text-3xl tabular">
                  ₦{(p.priceMonthlyNGN / 100).toLocaleString()}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">/mo</span>
                </p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {features[k].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {isOwner && !isCurrent ? (
                  <UpgradeButton plan={k} />
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {invoices.map((i) => (
                <div key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="tabular">₦{(i.amount / 100).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{formatRelative(i.createdAt)}</p>
                  </div>
                  <Badge
                    variant={i.status === 'paid' ? 'success' : i.status === 'pending' ? 'muted' : 'danger'}
                    className="capitalize"
                  >
                    {i.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
