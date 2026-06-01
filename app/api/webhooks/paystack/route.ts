import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPaystackSignature, verifyTransaction, PLANS, type PlanKey } from '@/lib/billing/paystack';
import { addDays } from 'date-fns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Paystack posts events here. We only trust `charge.success` for subscription activation,
 * and we *re-verify* the transaction against the Paystack API before mutating anything.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get('x-paystack-signature');

  if (!verifyPaystackSignature(raw, signature)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const event = payload?.event;
  const ref = payload?.data?.reference as string | undefined;
  if (!ref) return NextResponse.json({ ok: true, ignored: true });

  // Idempotency: if invoice already paid, skip
  const invoice = await prisma.invoice.findUnique({ where: { paystackRef: ref } });
  if (invoice?.status === 'paid') return NextResponse.json({ ok: true, idempotent: true });

  if (event === 'charge.success') {
    const verify = await verifyTransaction(ref);
    if (!verify?.status || verify.data.status !== 'success') {
      return NextResponse.json({ ok: false, reason: 'verify_failed' }, { status: 400 });
    }

    const meta = verify.data.metadata ?? {};
    const organizationId = meta.organizationId as string | undefined;
    const planKey = meta.plan as PlanKey | undefined;
    if (!organizationId || !planKey || !(planKey in PLANS)) {
      return NextResponse.json({ ok: false, reason: 'bad_metadata' }, { status: 400 });
    }

    const now = new Date();
    const periodEnd = addDays(now, 30);

    await prisma.$transaction(async (tx) => {
      // Upsert subscription
      await tx.subscription.upsert({
        where: { organizationId },
        create: {
          organizationId,
          plan: planKey,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        update: {
          plan: planKey,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAt: null,
        },
      });

      // Promote org plan
      await tx.organization.update({
        where: { id: organizationId },
        data: { plan: planKey },
      });

      // Mark invoice paid (or create if missing)
      if (invoice) {
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: 'paid', paidAt: now, amount: verify.data.amount },
        });
      } else {
        await tx.invoice.create({
          data: {
            organizationId,
            amount: verify.data.amount,
            currency: 'NGN',
            status: 'paid',
            paystackRef: ref,
            paidAt: now,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId,
          action: 'billing.paid',
          entity: 'Subscription',
          entityId: organizationId,
          metadata: { plan: planKey, amount: verify.data.amount, ref },
        },
      });
    });

    return NextResponse.json({ ok: true });
  }

  if (event === 'subscription.disable' || event === 'invoice.payment_failed') {
    // Mark sub past-due if we can find it
    const sub = await prisma.subscription.findFirst({
      where: { paystackSubCode: payload?.data?.subscription_code ?? undefined },
    });
    if (sub) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: event === 'subscription.disable' ? 'CANCELED' : 'PAST_DUE' },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
