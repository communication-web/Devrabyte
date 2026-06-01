import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOrgContext, ok } from '@/lib/api';
import { generateDailySummary } from '@/lib/jobs/reports';

export async function GET(req: NextRequest) {
  const ctx = await requireOrgContext();
  if (!ctx.ok) return ctx.response;

  const url = new URL(req.url);
  if (url.searchParams.get('generate') === '1') {
    const { summary, stats } = await generateDailySummary(ctx.organizationId, ctx.organization.name);
    return ok({ summary, stats });
  }

  const recent = await prisma.report.findMany({
    where: { organizationId: ctx.organizationId, kind: 'daily' },
    orderBy: { createdAt: 'desc' },
    take: 14,
  });
  return ok({ reports: recent });
}
