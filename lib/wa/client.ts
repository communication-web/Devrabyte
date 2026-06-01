import crypto from 'crypto';

const GRAPH_BASE = 'https://graph.facebook.com/v20.0';

export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected =
    'sha256=' +
    crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

export type WAInboundMessage = {
  waMessageId: string;
  from: string;            // E.164 without '+'
  text: string;
  timestamp: string;
};

/**
 * Parse the WhatsApp Cloud API webhook payload into a flat list of inbound messages.
 */
export function parseInbound(payload: any): WAInboundMessage[] {
  const out: WAInboundMessage[] = [];
  const entries = payload?.entry ?? [];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const messages = change?.value?.messages ?? [];
      for (const m of messages) {
        if (m.type !== 'text') continue;
        out.push({
          waMessageId: m.id,
          from: m.from,
          text: m.text?.body ?? '',
          timestamp: m.timestamp,
        });
      }
    }
  }
  return out;
}

/**
 * Send a plain-text WhatsApp message. Returns the message id or null on failure.
 */
export async function sendWhatsAppText(to: string, body: string): Promise<string | null> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneId || !token) {
    console.warn('[wa] missing credentials; message not sent:', { to, body });
    return null;
  }
  const resp = await fetch(`${GRAPH_BASE}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: body.slice(0, 4000), preview_url: false },
    }),
  });
  if (!resp.ok) {
    console.error('[wa] send failed', resp.status, await resp.text());
    return null;
  }
  const json = await resp.json();
  return json?.messages?.[0]?.id ?? null;
}
