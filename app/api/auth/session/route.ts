import { getCurrentUser } from '@/lib/auth/session';
import { ok } from '@/lib/api';

export async function GET() {
  const user = await getCurrentUser();
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
