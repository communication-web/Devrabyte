import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, signSession, setSessionCookie } from '@/lib/auth/session';
import { LoginSchema } from '@/lib/validators/schemas';
import { fail, ok, readJson, logAudit } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, { key: 'login', limit: 10, windowSec: 60 });
  if (!rl.allowed) return fail('Too many attempts, try again soon', 429);

  const parsed = await readJson(req, LoginSchema);
  if (!parsed.ok) return parsed.response;
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true },
  });
  if (!user || !user.passwordHash) return fail('Invalid credentials', 401);
  if (user.deletedAt) return fail('Account disabled', 403);

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return fail('Invalid credentials', 401);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = await signSession({
    userId: user.id,
    email: user.email,
    isSuperAdmin: user.isSuperAdmin,
  });
  await setSessionCookie(token);

  await logAudit({
    organizationId: user.memberships[0]?.organizationId ?? null,
    actorId: user.id,
    action: 'login',
    entity: 'User',
    entityId: user.id,
  });

  const redirectTo = user.memberships.length === 0 ? '/onboarding' : '/dashboard';
  return ok({ userId: user.id, redirectTo });
}
