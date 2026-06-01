import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, signSession, setSessionCookie } from '@/lib/auth/session';
import { SignupSchema } from '@/lib/validators/schemas';
import { fail, ok, readJson, logAudit } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { slugify } from '@/lib/utils';
import { addDays } from 'date-fns';

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, { key: 'signup', limit: 5, windowSec: 300 });
  if (!rl.allowed) return fail('Too many sign-ups from this network, try again later', 429);

  const parsed = await readJson(req, SignupSchema);
  if (!parsed.ok) return parsed.response;
  const { email, password, name, orgName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return fail('Email already in use', 409);

  // Ensure a unique slug
  let base = slugify(orgName);
  if (!base) base = 'workspace';
  let slug = base;
  for (let i = 1; i < 50; i++) {
    const clash = await prisma.organization.findUnique({ where: { slug } });
    if (!clash) break;
    slug = `${base}-${i}`;
  }

  const passwordHash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: orgName,
        slug,
        plan: 'TRIAL',
        trialEndsAt: addDays(new Date(), 14),
        settings: { create: {} },
      },
    });
    const user = await tx.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
    });
    await tx.membership.create({
      data: { userId: user.id, organizationId: org.id, role: 'OWNER' },
    });
    return { org, user };
  });

  const token = await signSession({
    userId: result.user.id,
    email: result.user.email,
    isSuperAdmin: result.user.isSuperAdmin,
  });
  await setSessionCookie(token);

  await logAudit({
    organizationId: result.org.id,
    actorId: result.user.id,
    action: 'signup',
    entity: 'User',
    entityId: result.user.id,
  });

  return ok({ userId: result.user.id, organizationId: result.org.id, redirectTo: '/onboarding' });
}
