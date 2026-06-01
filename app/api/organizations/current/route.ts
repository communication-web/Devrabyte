import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireOrgContext, readJson, ok, logAudit } from '@/lib/api';

const UpdateOrgSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  industry: z.string().max(80).optional().nullable(),
  teamSize: z.string().max(40).optional().nullable(),
  dailySummaryAt: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().max(64).optional(),
});

export async function GET() {
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;
  const org = await prisma.organization.findUnique({
    where: { id: ctx.organizationId },
    include: { settings: true, subscription: true },
  });
  return ok({ organization: org, role: ctx.membership.role });
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireOrgContext('ADMIN');
  if (!ctx.ok) return ctx.response;

  const parsed = await readJson(req, UpdateOrgSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.organization.update({
    where: { id: ctx.organizationId },
    data: parsed.data,
  });

  await logAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: 'org.update',
    entity: 'Organization',
    entityId: updated.id,
    metadata: parsed.data,
  });

  return ok({ organization: updated });
}
