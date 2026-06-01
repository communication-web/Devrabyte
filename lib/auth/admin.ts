import { getCurrentUser } from '@/lib/auth/session';
import { fail } from '@/lib/api';

export async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, response: fail('Unauthorized', 401) };
  if (!user.isSuperAdmin) return { ok: false as const, response: fail('Forbidden', 403) };
  return { ok: true as const, user };
}
