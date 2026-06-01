import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth/admin';
import { ok } from '@/lib/api';

export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const orgId = url.searchParams.get('organizationId');
  const take = Math.min(Number(url.searchParams.get('limit') ?? '100'), 500);

  const logs = await prisma.auditLog.findMany({
    where: { ...(orgId ? { organizationId: orgId } : {}) },
    include: {
      actor: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take,
  });

  return ok({ logs });
}
