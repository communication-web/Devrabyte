import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/session';

const PROTECTED_PREFIXES = ['/dashboard', '/tasks', '/workflows', '/team', '/reports', '/bottlenecks', '/settings', '/billing', '/onboarding', '/whatsapp', '/admin'];
const AUTH_PAGES = ['/login', '/signup'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookieName = process.env.AUTH_COOKIE_NAME ?? 'devrabyte_session';
  const token = req.cookies.get(cookieName)?.value;
  const session = token ? await verifySession(token) : null;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && session) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/admin') && session && !session.isSuperAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/whatsapp|api/webhooks|api/cron|.*\\.).*)'],
};
