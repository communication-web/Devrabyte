import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOrgContext, ok } from '@/lib/api';
import { generateWeeklySummary } from '@/lib/jobs/reports';

export async function GET(req: NextRequest) {
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;

  const url = new URL(req.url);
  if (url.searchParams.get('generate') === '1') {
    const { summary } = await generateWeeklySummary(ctx.organizationId, ctx.organization.name);
    return ok({ summary });
  }

  const recent = await prisma.report.findMany({
    where: { organizationId: ctx.organizationId, kind: 'weekly' },
    orderBy: { createdAt: 'desc' },
    take: 12,
  });
  return ok({ reports: recent });
}
