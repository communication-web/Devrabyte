import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import type { Role } from '@prisma/client';

const COOKIE = process.env.AUTH_COOKIE_NAME ?? 'devrabyte_session';
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? 'dev-insecure-secret-change-me');

export type SessionPayload = {
  userId: string;
  email: string;
  isSuperAdmin: boolean;
};

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function signSession(payload: SessionPayload, ttlDays = 30) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttlDays}d`)
    .setIssuer('devrabyte')
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: 'devrabyte' });
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      isSuperAdmin: Boolean(payload.isSuperAdmin),
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      memberships: { include: { organization: true } },
    },
  });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

/**
 * Resolve the active organization + membership for the current user.
 * For MVP: uses first membership. In v2 we'd store activeOrgId in the session or a cookie.
 */
export async function requireOrg() {
  const user = await requireUser();
  const membership = user.memberships[0];
  if (!membership) throw new Error('NO_ORGANIZATION');
  return { user, membership, organization: membership.organization };
}

export function canManage(role: Role): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER';
}

export function canAdmin(role: Role): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}
