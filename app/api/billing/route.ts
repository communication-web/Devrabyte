import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireOrgContext, readJson, ok, fail, logAudit } from '@/lib/api';
import { PLANS, initializeTransaction, type PlanKey } from '@/lib/billing/paystack';
import { randomToken } from '@/lib/utils';

export async function GET() {
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;

  const [subscription, invoices] = await Promise.all([
    prisma.subscription.findUnique({ where: { organizationId: ctx.organizationId } }),
    prisma.invoice.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 24,
    }),
  ]);

  return ok({
    plan: ctx.organization.plan,
    trialEndsAt: ctx.organization.trialEndsAt,
    plans: Object.values(PLANS),
    subscription,
    invoices,
  });
}

const UpgradeSchema = z.object({
  plan: z.enum(['STARTER', 'GROWTH', 'PRO', 'ENTERPRISE']),
});

/**
 * Kicks off a Paystack checkout session for the requested plan.
 * On success, frontend redirects the owner to Paystack's hosted page.
 * The subscription is actually activated by the Paystack webhook.
 */
export async function POST(req: NextRequest) {
  const ctx = await requireOrgContext('OWNER');
  if (!ctx.ok) return ctx.response;

  const parsed = await readJson(req, UpgradeSchema);
  if (!parsed.ok) return parsed.response;
  const planKey = parsed.data.plan as PlanKey;
  const plan = PLANS[planKey];

  if (planKey === 'ENTERPRISE') {
    return ok({
      contactSales: true,
      message: 'Our team will reach out for Enterprise pricing.',
    });
  }

  const reference = `devrabyte_${ctx.organizationId}_${planKey}_${randomToken(8)}`;
  const init = await initializeTransaction({
    email: ctx.user.email,
    amount: plan.priceMonthlyNGN,
    reference,
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing?ref=${reference}`,
    metadata: { organizationId: ctx.organizationId, plan: planKey, userId: ctx.user.id },
  });

  if (!init?.status) return fail('Payment init failed', 502, init);

  // Pre-create a pending invoice record so webhook can update it idempotently
  await prisma.invoice.create({
    data: {
      organizationId: ctx.organizationId,
      amount: plan.priceMonthlyNGN,
      currency: 'NGN',
      status: 'pending',
      paystackRef: reference,
    },
  });

  await logAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: 'billing.checkout_init',
    entity: 'Subscription',
    metadata: { plan: planKey, reference },
  });

  return ok({
    authorizationUrl: init.data.authorization_url,
    reference,
  });
}
