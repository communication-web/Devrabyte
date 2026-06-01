import crypto from 'crypto';

const PAYSTACK_BASE = 'https://api.paystack.co';

export type PlanKey = 'STARTER' | 'GROWTH' | 'PRO' | 'ENTERPRISE';

export const PLANS: Record<PlanKey, {
  key: PlanKey;
  name: string;
  priceMonthlyNGN: number;   // minor units (kobo) - Paystack uses kobo for NGN
  seatLimit: number;
  taskLimitPerMonth: number | null;
  whatsappEnabled: boolean;
  aiQuotaPerMonth: number | null;
  description: string;
}> = {
  STARTER: {
    key: 'STARTER',
    name: 'Starter',
    priceMonthlyNGN: 15_000 * 100,
    seatLimit: 5,
    taskLimitPerMonth: 500,
    whatsappEnabled: true,
    aiQuotaPerMonth: 500,
    description: 'For small teams just getting started with structured ops.',
  },
  GROWTH: {
    key: 'GROWTH',
    name: 'Growth',
    priceMonthlyNGN: 45_000 * 100,
    seatLimit: 20,
    taskLimitPerMonth: 3_000,
    whatsappEnabled: true,
    aiQuotaPerMonth: 3_000,
    description: 'Growing SMEs needing full WhatsApp + AI coverage.',
  },
  PRO: {
    key: 'PRO',
    name: 'Pro',
    priceMonthlyNGN: 120_000 * 100,
    seatLimit: 75,
    taskLimitPerMonth: null,
    whatsappEnabled: true,
    aiQuotaPerMonth: 15_000,
    description: 'Multi-team operations with bottleneck insights.',
  },
  ENTERPRISE: {
    key: 'ENTERPRISE',
    name: 'Enterprise',
    priceMonthlyNGN: 0, // bespoke
    seatLimit: 1000,
    taskLimitPerMonth: null,
    whatsappEnabled: true,
    aiQuotaPerMonth: null,
    description: 'Custom pricing, SSO, dedicated onboarding.',
  },
};

export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const hash = crypto.createHmac('sha512', secret).update(rawBody, 'utf8').digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}

type PaystackResp<T> = { status: boolean; message: string; data: T };

async function paystackFetch<T>(path: string, init?: RequestInit): Promise<PaystackResp<T> | null> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return null;
  const resp = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!resp.ok) {
    console.error('[paystack]', path, resp.status, await resp.text());
    return null;
  }
  return (await resp.json()) as PaystackResp<T>;
}

export async function initializeTransaction(args: {
  email: string;
  amount: number; // kobo
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  return paystackFetch<{ authorization_url: string; access_code: string; reference: string }>(
    '/transaction/initialize',
    {
      method: 'POST',
      body: JSON.stringify({
        email: args.email,
        amount: args.amount,
        reference: args.reference,
        callback_url: args.callbackUrl,
        metadata: args.metadata,
      }),
    },
  );
}

export async function verifyTransaction(reference: string) {
  return paystackFetch<{ status: string; amount: number; customer: { email: string }; metadata: any }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
}
