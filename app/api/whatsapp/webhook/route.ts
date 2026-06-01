import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { parseInbound, sendWhatsAppText, verifyWebhookSignature } from '@/lib/wa/client';
import { parseMessageIntent, handleIntent } from '@/lib/ai/orchestrator';

export const runtime = 'nodejs';
// Important: we need the raw body for signature verification.
export const dynamic = 'force-dynamic';

/**
 * Webhook verification handshake (Meta sends hub.challenge).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200, headers: { 'content-type': 'text/plain' } });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get('x-hub-signature-256');

  // Verify signature in production. Skip only if no app secret is configured (dev).
  if (process.env.WHATSAPP_APP_SECRET) {
    if (!verifyWebhookSignature(raw, signature)) {
      return new NextResponse('Invalid signature', { status: 401 });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new NextResponse('Bad JSON', { status: 400 });
  }

  const inboundList = parseInbound(payload);

  // Acknowledge fast; process inline for MVP. In production enqueue to BullMQ.
  for (const m of inboundList) {
    try {
      await processInbound(m);
    } catch (err) {
      console.error('[wa] processing failed', err);
    }
  }

  return NextResponse.json({ ok: true });
}

async function processInbound(m: {
  waMessageId: string;
  from: string;
  text: string;
  timestamp: string;
}) {
  // 1. Idempotency: skip if we've seen this wa message id before
  const existing = await prisma.message.findUnique({ where: { waMessageId: m.waMessageId } });
  if (existing) return;

  // 2. Map sender phone → User. We match by phone directly.
  const phone = normalizePhone(m.from);
  const user = await prisma.user.findUnique({
    where: { phone },
    include: { memberships: { include: { organization: true } } },
  });

  // 3. Determine organization context. If the user has memberships, use the first
  //    (in v2 this could be selected via a "set active org" command).
  //    If the user isn't registered, we log and reply with onboarding instructions.
  if (!user || user.memberships.length === 0) {
    await prisma.message.create({
      data: {
        channel: 'WHATSAPP',
        direction: 'INBOUND',
        waMessageId: m.waMessageId,
        fromNumber: phone,
        body: m.text,
        processed: true,
        errorMessage: 'UNKNOWN_SENDER',
      },
    });
    await sendWhatsAppText(
      m.from,
      `👋 Welcome to Devrabyte AI Ops. This number isn't linked to a workspace yet.\n\nSign up at ${process.env.NEXT_PUBLIC_APP_URL ?? 'https://devrabyte.ai'} and add this phone number in Settings → WhatsApp.`,
    );
    return;
  }

  const membership = user.memberships[0];
  const organization = membership.organization;

  // 4. Log inbound message
  const msg = await prisma.message.create({
    data: {
      channel: 'WHATSAPP',
      direction: 'INBOUND',
      waMessageId: m.waMessageId,
      userId: user.id,
      organizationId: organization.id,
      fromNumber: phone,
      body: m.text,
    },
  });

  // 5. Parse intent via Claude
  const intent = await parseMessageIntent({
    text: m.text,
    organization,
    senderUser: user,
  });

  // Graceful degradation if Claude unavailable → echo help
  if (!intent) {
    const fallback = 'I couldn\'t process that right now. Try "help" to see what I can do, or use the dashboard.';
    await sendWhatsAppText(m.from, fallback);
    await prisma.message.update({
      where: { id: msg.id },
      data: { processed: true, errorMessage: 'AI_UNAVAILABLE' },
    });
    await prisma.message.create({
      data: {
        channel: 'WHATSAPP',
        direction: 'OUTBOUND',
        userId: user.id,
        organizationId: organization.id,
        toNumber: phone,
        body: fallback,
        processed: true,
      },
    });
    return;
  }

  // 6. Execute intent deterministically
  const reply = await handleIntent(intent, {
    organization,
    senderUser: user,
    senderPhone: phone,
  });

  // 7. Send reply + log outbound
  await sendWhatsAppText(m.from, reply);
  await prisma.message.update({
    where: { id: msg.id },
    data: {
      processed: true,
      parsedIntent: intent.intent,
      aiRaw: intent as any,
    },
  });
  await prisma.message.create({
    data: {
      channel: 'WHATSAPP',
      direction: 'OUTBOUND',
      userId: user.id,
      organizationId: organization.id,
      toNumber: phone,
      body: reply,
      parsedIntent: intent.intent,
      processed: true,
    },
  });
}

function normalizePhone(p: string) {
  // WhatsApp Cloud API sends numbers in E.164 without the leading '+'.
  return p.startsWith('+') ? p : `+${p}`;
}
