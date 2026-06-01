import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireOrgContext, readJson, ok, fail, logAudit } from '@/lib/api';

const LinkSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/, 'Must be E.164 like +2348012345678'),
});

export async function POST(req: NextRequest) {
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;

  const parsed = await readJson(req, LinkSchema);
  if (!parsed.ok) return parsed.response;

  const { phone } = parsed.data;
  const clash = await prisma.user.findFirst({ where: { phone, NOT: { id: ctx.user.id } } });
  if (clash) return fail('This phone number is already linked to another account.', 409);

  await prisma.user.update({
    where: { id: ctx.user.id },
    data: { phone },
  });

  await logAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: 'whatsapp.link_number',
    entity: 'User',
    entityId: ctx.user.id,
    metadata: { phone: phone.slice(0, -4) + '****' },
  });

  return ok({ phone });
}

export async function DELETE() {
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;
  await prisma.user.update({ where: { id: ctx.user.id }, data: { phone: null } });
  return ok({ unlinked: true });
}
