import { NextRequest, NextResponse } from 'next/server';

/**
 * Protect cron endpoints. Accepts either:
 *   - Authorization: Bearer <CRON_SECRET>   (Vercel Cron style)
 *   - ?secret=<CRON_SECRET>                 (simple manual trigger)
 */
export function authorizeCron(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const auth = req.headers.get('authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  const qs = new URL(req.url).searchParams.get('secret');
  if (bearer !== secret && qs !== secret) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  return null;
}
