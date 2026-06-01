/**
 * Rate limiter for auth and webhook endpoints.
 *
 * Strategy:
 *   - If UPSTASH_REDIS_REST_URL is set, use Upstash (works on Vercel Edge + Node).
 *   - Otherwise fall back to an in-memory token bucket. The in-memory path is only
 *     safe on a single instance — it's meant for local dev and single-node deploys.
 *
 * Usage:
 *   const res = await rateLimit(req, { key: 'login', limit: 5, windowSec: 60 });
 *   if (!res.allowed) return fail('Too many requests', 429);
 */

import type { NextRequest } from 'next/server';

type LimitResult = { allowed: boolean; remaining: number; resetAt: number };

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/* -------------------- in-memory fallback -------------------- */
const buckets = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(bucketKey: string, limit: number, windowMs: number): LimitResult {
  const now = Date.now();
  const b = buckets.get(bucketKey);
  if (!b || b.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (b.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: b.resetAt };
  }
  b.count += 1;
  return { allowed: true, remaining: limit - b.count, resetAt: b.resetAt };
}

// Light periodic cleanup so the map doesn't grow forever
let lastSweep = Date.now();
function maybeSweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}

/* -------------------- upstash path -------------------- */
async function upstashLimit(bucketKey: string, limit: number, windowSec: number): Promise<LimitResult> {
  // Uses INCR + EXPIRE atomically via a pipeline
  const pipeline = [
    ['INCR', bucketKey],
    ['EXPIRE', bucketKey, String(windowSec), 'NX'],
    ['PTTL', bucketKey],
  ];
  const resp = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pipeline),
    cache: 'no-store',
  });
  if (!resp.ok) {
    // On Upstash failure, fail-open so we don't deny legitimate traffic.
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowSec * 1000 };
  }
  const results = (await resp.json()) as Array<{ result: number | string }>;
  const count = Number(results[0]?.result ?? 0);
  const ttl = Number(results[2]?.result ?? windowSec * 1000);
  const resetAt = Date.now() + (ttl > 0 ? ttl : windowSec * 1000);
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetAt };
}

/* -------------------- public API -------------------- */
export async function rateLimit(
  req: NextRequest | Request,
  opts: { key: string; limit: number; windowSec: number; id?: string },
): Promise<LimitResult> {
  maybeSweep();
  const id = opts.id ?? identify(req);
  const bucketKey = `rl:${opts.key}:${id}`;
  const windowMs = opts.windowSec * 1000;

  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      return await upstashLimit(bucketKey, opts.limit, opts.windowSec);
    } catch {
      return memoryLimit(bucketKey, opts.limit, windowMs);
    }
  }
  return memoryLimit(bucketKey, opts.limit, windowMs);
}

function identify(req: NextRequest | Request): string {
  const h = 'headers' in req ? (req.headers as Headers) : new Headers();
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  const real = h.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}
