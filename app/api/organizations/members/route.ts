import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOrgContext, readJson, ok, fail, logAudit } from '@/lib/api';
import { InviteMemberSchema } from '@/lib/validators/schemas';
import { randomToken } from '@/lib/utils';
import { addDays } from 'date-fns';

export async function GET() {
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;

  const [members, invites] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: ctx.organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            avatarUrl: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.invite.findMany({
      where: { organizationId: ctx.organizationId, acceptedAt: null },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Workload counts per member
  const workload = await prisma.task.groupBy({
    by: ['assigneeId'],
    where: {
      organizationId: ctx.organizationId,
      deletedAt: null,
      status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] },
    },
    _count: { _all: true },
  });
  const workloadMap = Object.fromEntries(workload.map((w) => [w.assigneeId ?? '', w._count._all]));

  return ok({
    members: members.map((m) => ({
      ...m,
      openTaskCount: workloadMap[m.userId] ?? 0,
    })),
    invites,
  });
}

export async function POST(req: NextRequest) {
  const ctx = await requireOrgContext('ADMIN');
  if (!ctx.ok) return ctx.response;

  const parsed = await readJson(req, InviteMemberSchema);
  if (!parsed.ok) return parsed.response;
  const { email, role } = parsed.data;

  // If user already a member of this org, no-op
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: existingUser.id,
          organizationId: ctx.organizationId,
        },
      },
    });
    if (existingMembership) return fail('Already a member', 409);
  }

  // Reuse pending invite if present
  const existingInvite = await prisma.invite.findFirst({
    where: { organizationId: ctx.organizationId, email, acceptedAt: null },
  });
  if (existingInvite) return ok({ invite: existingInvite });

  const invite = await prisma.invite.create({
    data: {
      organizationId: ctx.organizationId,
      email,
      role,
      token: randomToken(24),
      invitedById: ctx.user.id,
      expiresAt: addDays(new Date(), 14),
    },
  });

  await logAudit({
    organizationId: ctx.organizationId,
    actorId: ctx.user.id,
    action: 'team.invite',
    entity: 'Invite',
    entityId: invite.id,
    metadata: { email, role },
  });

  // In real production: email the invite link. For MVP we just return it.
  return ok({
    invite,
    inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/signup?invite=${invite.token}`,
  });
}
