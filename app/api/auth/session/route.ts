import { NextRequest } from 'next/server';
import { getCurrentUser, verifySession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { ok } from '@/lib/api';

export async function GET(req: NextRequest) {
  // Support mobile clients that pass a Bearer token instead of a cookie
  const auth = req.headers.get('authorization');
  let user = null;
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const session = await verifySession(token);
    if (session) {
      user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { memberships: { include: { organization: true } } },
      });
    }
  } else {
    user = await getCurrentUser();
  }

  if (!user) return ok({ user: null });
  return ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperAdmin: user.isSuperAdmin,
      memberships: user.memberships.map((m) => ({
        role: m.role,
        organization: { id: m.organization.id, name: m.organization.name, slug: m.organization.slug },
      })),
    },
  });
}
