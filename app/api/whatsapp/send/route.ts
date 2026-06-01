import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireOrgContext, readJson, ok, fail } from '@/lib/api';
import { sendWhatsAppText } from '@/lib/wa/client';
import { prisma } from '@/lib/db';

const SendSchema = z.object({
  to: z.string().min(6).max(20),    // E.164
  body: z.string().min(1).max(3800),
});

export async function POST(req: NextRequest) {
  const ctx = await requireOrgContext('MANAGER');
  if (!ctx.ok) return ctx.response;

  const parsed = await readJson(req, SendSchema);
  if (!parsed.ok) return parsed.response;

  const id = await sendWhatsAppText(parsed.data.to, parsed.data.body);
  if (!id) return fail('WhatsApp send failed. Check credentials.', 502);

  await prisma.message.create({
    data: {
      channel: 'WHATSAPP',
      direction: 'OUTBOUND',
      organizationId: ctx.organizationId,
      userId: ctx.user.id,
      toNumber: parsed.data.to,
      body: parsed.data.body,
      waMessageId: id,
      processed: true,
    },
  });

  return ok({ sent: true, id });
}
