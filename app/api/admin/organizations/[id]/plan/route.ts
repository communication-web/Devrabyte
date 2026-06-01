import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth/admin';
import { readJson, ok, fail, logAudit } from '@/lib/api';

const BodySchema = z.object({
  plan: z.enum(['TRIAL', 'STARTER', 'GROWTH', 'PRO', 'ENTERPRISE']),
  extendTrialDays: z.number().int().min(0).max(120).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = await readJson(req, BodySchema);
  if (!parsed.ok) return parsed.response;

  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) return fail('Organization not found', 404);

  const trialEndsAt =
    parsed.data.extendTrialDays && parsed.data.extendTrialDays > 0
      ? new Date(Date.now() + parsed.data.extendTrialDays * 24 * 60 * 60 * 1000)
      : org.trialEndsAt;

  const updated = await prisma.organization.update({
    where: { id },
    data: { plan: parsed.data.plan, trialEndsAt },
  });

  if (parsed.data.plan !== 'TRIAL') {
    await prisma.subscription.upsert({
      where: { organizationId: id },
      create: {
        organizationId: id,
        plan: parsed.data.plan,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: { plan: parsed.data.plan, status: 'ACTIVE' },
    });
  }

  await logAudit({
    organizationId: id,
    actorId: auth.user.id,
    action: 'admin.plan_change',
    entity: 'Organization',
    entityId: id,
    metadata: parsed.data,
  });

  return ok({ organization: updated });
}
