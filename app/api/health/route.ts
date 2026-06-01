import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Minimal health probe for uptime monitors (BetterStack, UptimeRobot, etc.).
 * Returns 200 when the DB is reachable and 503 otherwise.
 */
export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        ok: true,
        service: 'devrabyte-ai-ops',
        db: 'up',
        ai: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not configured',
        whatsapp: process.env.WHATSAPP_PHONE_NUMBER_ID ? 'configured' : 'not configured',
        paystack: process.env.PAYSTACK_SECRET_KEY ? 'configured' : 'not configured',
        elapsedMs: Date.now() - started,
      },
      { status: 200, headers: { 'cache-control': 'no-store' } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        service: 'devrabyte-ai-ops',
        db: 'down',
        error: err instanceof Error ? err.message : 'unknown',
        elapsedMs: Date.now() - started,
      },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
}
