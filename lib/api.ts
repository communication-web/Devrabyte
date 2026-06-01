import { NextResponse } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import type { Role } from '@prisma/client';

export function ok<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json({ ok: true, data }, typeof init === 'number' ? { status: init } : init);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}

export async function readJson<T>(req: Request, schema: ZodSchema<T>): Promise<
  { ok: true; data: T } | { ok: false; response: NextResponse }
> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, response: fail('Invalid JSON body', 400) };
  }
  try {
    return { ok: true, data: schema.parse(raw) };
  } catch (err) {
    if (err instanceof ZodError) {
      return { ok: false, response: fail('Validation failed', 422, err.flatten()) };
    }
    throw err;
  }
}

/**
 * Resolve current user + active org membership, enforcing tenant scoping.
 * All business-data routes should use this.
 */
export async function requireOrgContext(minRole?: Role) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, response: fail('Unauthorized', 401) };

  const membership = user.memberships[0];
  if (!membership) {
    return { ok: false as const, response: fail('No organization', 403) };
  }

  if (minRole) {
    const rank: Record<Role, number> = { OWNER: 4, ADMIN: 3, MANAGER: 2, MEMBER: 1 };
    if (rank[membership.role] < rank[minRole]) {
      return { ok: false as const, response: fail('Forbidden', 403) };
    }
  }

  return {
    ok: true as const,
    user,
    membership,
    organizationId: membership.organizationId,
    organization: membership.organization,
  };
}

export async function logAudit(opts: {
  organizationId?: string | null;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: opts.organizationId ?? null,
        actorId: opts.actorId ?? null,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId ?? null,
        metadata: opts.metadata as any,
      },
    });
  } catch (e) {
    console.error('[audit] failed', e);
  }
}
