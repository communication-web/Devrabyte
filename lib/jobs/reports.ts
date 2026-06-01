import { prisma } from '@/lib/db';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { callClaudeText } from '@/lib/ai/claude';
import { SUMMARY_SYSTEM } from '@/lib/ai/prompts';

type TaskStats = {
  completedToday: number;
  createdToday: number;
  openNow: number;
  overdueNow: number;
  blockedNow: number;
  dueToday: number;
};

export async function computeDailyStats(organizationId: string): Promise<TaskStats> {
  const dayStart = startOfDay(new Date());
  const dayEnd = endOfDay(new Date());
  const now = new Date();

  const [completedToday, createdToday, openNow, overdueNow, blockedNow, dueToday] = await Promise.all([
    prisma.task.count({
      where: { organizationId, deletedAt: null, completedAt: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.task.count({
      where: { organizationId, deletedAt: null, createdAt: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.task.count({
      where: { organizationId, deletedAt: null, status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] } },
    }),
    prisma.task.count({
      where: {
        organizationId,
        deletedAt: null,
        dueAt: { lt: now },
        status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] },
      },
    }),
    prisma.task.count({
      where: { organizationId, deletedAt: null, status: 'BLOCKED' },
    }),
    prisma.task.count({
      where: {
        organizationId,
        deletedAt: null,
        dueAt: { gte: dayStart, lte: dayEnd },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    }),
  ]);

  return { completedToday, createdToday, openNow, overdueNow, blockedNow, dueToday };
}

export async function generateDailySummary(organizationId: string, orgName: string) {
  const stats = await computeDailyStats(organizationId);
  const factLine = `Completed today: ${stats.completedToday}. Created today: ${stats.createdToday}. Open: ${stats.openNow}. Due today: ${stats.dueToday}. Overdue: ${stats.overdueNow}. Blocked: ${stats.blockedNow}.`;

  const ai = await callClaudeText({
    system: SUMMARY_SYSTEM,
    user: `Organization: ${orgName}
Daily metrics:
${factLine}

Write a concise daily ops summary for the team.`,
    maxTokens: 300,
  });

  const summary = ai ?? fallbackDailySummary(stats);
  await prisma.report.create({
    data: {
      organizationId,
      kind: 'daily',
      periodStart: startOfDay(new Date()),
      periodEnd: endOfDay(new Date()),
      summary,
      data: stats as any,
    },
  });
  return { summary, stats };
}

function fallbackDailySummary(s: TaskStats) {
  const lines = [
    `• Completed today: ${s.completedToday}`,
    `• Created today: ${s.createdToday}`,
    `• Due today: ${s.dueToday}`,
    `• Overdue: ${s.overdueNow}`,
    `• Blocked: ${s.blockedNow}`,
  ];
  const suggestion =
    s.overdueNow > 0
      ? '👉 Clear at least one overdue task this morning.'
      : s.blockedNow > 0
        ? '👉 Unblock one stuck task today.'
        : '👉 Keep momentum — pick the most important due-today task first.';
  return lines.join('\n') + '\n' + suggestion;
}

export async function generateWeeklySummary(organizationId: string, orgName: string) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const prevWeekStart = subDays(weekStart, 7);

  const [completedThis, completedPrev, created, overdue, blocked] = await Promise.all([
    prisma.task.count({ where: { organizationId, completedAt: { gte: weekStart, lte: weekEnd } } }),
    prisma.task.count({
      where: { organizationId, completedAt: { gte: prevWeekStart, lt: weekStart } },
    }),
    prisma.task.count({ where: { organizationId, createdAt: { gte: weekStart, lte: weekEnd } } }),
    prisma.task.count({
      where: {
        organizationId,
        dueAt: { lt: new Date() },
        status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] },
      },
    }),
    prisma.task.count({ where: { organizationId, status: 'BLOCKED' } }),
  ]);

  const delta = completedThis - completedPrev;
  const factLine = `This week — created ${created}, completed ${completedThis} (vs ${completedPrev} last week, delta ${delta >= 0 ? '+' : ''}${delta}). Overdue now: ${overdue}. Blocked now: ${blocked}.`;

  const ai = await callClaudeText({
    system: SUMMARY_SYSTEM,
    user: `Organization: ${orgName}\n${factLine}\n\nWrite a weekly ops recap for the team lead.`,
    maxTokens: 400,
  });

  const summary =
    ai ??
    `Weekly recap\n• Created: ${created}\n• Completed: ${completedThis} (${delta >= 0 ? '+' : ''}${delta} vs last week)\n• Overdue: ${overdue}\n• Blocked: ${blocked}\n👉 Review overdue items in the morning standup.`;

  await prisma.report.create({
    data: {
      organizationId,
      kind: 'weekly',
      periodStart: weekStart,
      periodEnd: weekEnd,
      summary,
      data: { completedThis, completedPrev, created, overdue, blocked, delta } as any,
    },
  });

  return { summary };
}
