import { prisma } from '@/lib/db';
import { callClaudeJson, callClaudeText } from '@/lib/ai/claude';
import {
  IntentSchema,
  INTENT_SYSTEM_PROMPT,
  buildIntentUserPrompt,
  BOTTLENECK_SYSTEM,
  type Intent,
} from '@/lib/ai/prompts';
import { detectBottlenecks } from '@/lib/jobs/bottlenecks';
import { computeDailyStats, generateWeeklySummary } from '@/lib/jobs/reports';
import type { Organization, User } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';

/**
 * Find the most likely assignee from a free-text name within the org's members.
 * Exact > starts-with > contains > first-name match.
 */
async function resolveAssignee(organizationId: string, name: string | null | undefined) {
  if (!name) return null;
  const members = await prisma.membership.findMany({
    where: { organizationId },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });
  const needle = name.toLowerCase().trim();
  const users = members.map((m) => m.user);

  const exact = users.find((u) => u.name?.toLowerCase() === needle);
  if (exact) return exact;
  const startsWith = users.find((u) => u.name?.toLowerCase().startsWith(needle));
  if (startsWith) return startsWith;
  const contains = users.find((u) => u.name?.toLowerCase().includes(needle));
  if (contains) return contains;
  const first = users.find((u) => u.name?.toLowerCase().split(' ')[0] === needle.split(' ')[0]);
  return first ?? null;
}

/**
 * Try to find a task the user is referencing. Uses loose phrase matching over open tasks.
 */
async function resolveTask(organizationId: string, reference: string | null | undefined) {
  if (!reference) return null;
  const q = reference.toLowerCase().trim();
  const candidates = await prisma.task.findMany({
    where: {
      organizationId,
      deletedAt: null,
      status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] },
    },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });
  // Rank: exact includes, then word overlap
  const ranked = candidates
    .map((t) => {
      const title = t.title.toLowerCase();
      let score = 0;
      if (title.includes(q)) score += 5;
      const qWords = q.split(/\s+/).filter((w) => w.length > 2);
      for (const w of qWords) if (title.includes(w)) score += 1;
      return { task: t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.task ?? null;
}

type HandleContext = {
  organization: Organization;
  senderUser: User | null;          // sender mapped to a User, if identifiable
  senderPhone: string;
};

/**
 * Parse the raw text via Claude and return the (validated) Intent.
 */
export async function parseMessageIntent(args: {
  text: string;
  organization: Organization;
  senderUser: User | null;
}): Promise<Intent | null> {
  const members = await prisma.user.findMany({
    where: { memberships: { some: { organizationId: args.organization.id } } },
    select: { name: true, phone: true },
  });

  const prompt = buildIntentUserPrompt({
    message: args.text,
    orgName: args.organization.name,
    senderName: args.senderUser?.name,
    teamMembers: members,
    nowIso: new Date().toISOString(),
    timezone: args.organization.timezone,
  });

  const result = await callClaudeJson({
    system: INTENT_SYSTEM_PROMPT,
    user: prompt,
    schema: IntentSchema,
    maxTokens: 600,
  });

  if (!result.ok) {
    console.warn('[ai] intent parse failed:', result.reason);
    return null;
  }
  return result.data;
}

/**
 * Execute an Intent against the database with full validation + tenant scoping.
 * Returns the human-readable reply text to send back.
 */
export async function handleIntent(intent: Intent, ctx: HandleContext): Promise<string> {
  const { organization, senderUser } = ctx;

  // The sender must be a member of this org to mutate data.
  const isMember =
    senderUser &&
    (await prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId: senderUser.id, organizationId: organization.id },
      },
    }));

  switch (intent.intent) {
    case 'help':
      return (
        'Here are things you can ask me:\n' +
        '• "Assign task to Mary: follow up with ABC Ltd tomorrow"\n' +
        '• "What\'s pending today?"\n' +
        '• "Show overdue tasks"\n' +
        '• "What\'s blocking us?"\n' +
        '• "Summarize the week"\n' +
        '• "Mark the ABC follow-up as done"'
      );

    case 'create_task': {
      if (!isMember || !senderUser) return 'I couldn\'t verify your account for this business. Please sign up at the dashboard first.';
      if (!intent.task_title) return intent.reply_message || 'What task should I create? Give me a short title.';

      const assignee = await resolveAssignee(organization.id, intent.assignee_name);
      const due = intent.due_date_iso ? new Date(intent.due_date_iso) : null;

      const task = await prisma.task.create({
        data: {
          organizationId: organization.id,
          createdById: senderUser.id,
          title: intent.task_title,
          description: intent.task_description ?? null,
          assigneeId: assignee?.id ?? null,
          priority: intent.priority ?? 'MEDIUM',
          dueAt: due,
        },
      });
      await prisma.taskHistory.create({
        data: { taskId: task.id, actorId: senderUser.id, action: 'created', metadata: { source: 'whatsapp' } },
      });
      await prisma.activityEvent.create({
        data: {
          organizationId: organization.id,
          actorId: senderUser.id,
          kind: 'task.created',
          summary: `${senderUser.name ?? 'Someone'} created "${task.title}" via WhatsApp`,
          data: { taskId: task.id },
        },
      });

      const assigneeLine = assignee ? ` for ${assignee.name ?? 'the assignee'}` : '';
      const dueLine = due ? `, due ${due.toDateString()}` : '';
      return `✅ Created "${task.title}"${assigneeLine}${dueLine}.`;
    }

    case 'update_task_status': {
      if (!isMember || !senderUser) return 'I couldn\'t verify your account for this business.';
      if (!intent.new_status) return 'Which status should I set?';
      const task = await resolveTask(organization.id, intent.task_reference);
      if (!task) return 'I couldn\'t find that task. Can you share a few words from its title?';

      const prev = task.status;
      const completedAt = intent.new_status === 'DONE' ? new Date() : intent.new_status === 'PENDING' || intent.new_status === 'IN_PROGRESS' ? null : task.completedAt;

      await prisma.task.update({
        where: { id: task.id },
        data: { status: intent.new_status, completedAt },
      });
      await prisma.taskHistory.create({
        data: {
          taskId: task.id,
          actorId: senderUser.id,
          action: 'status_change',
          metadata: { from: prev, to: intent.new_status, source: 'whatsapp' },
        },
      });
      await prisma.activityEvent.create({
        data: {
          organizationId: organization.id,
          actorId: senderUser.id,
          kind: `task.${intent.new_status.toLowerCase()}`,
          summary: `${senderUser.name ?? 'Someone'} moved "${task.title}" to ${intent.new_status}`,
          data: { taskId: task.id },
        },
      });
      return `✅ "${task.title}" → ${intent.new_status}.`;
    }

    case 'reassign_task': {
      if (!isMember || !senderUser) return 'I couldn\'t verify your account for this business.';
      const task = await resolveTask(organization.id, intent.task_reference);
      if (!task) return 'I couldn\'t find that task.';
      const assignee = await resolveAssignee(organization.id, intent.assignee_name);
      if (!assignee) return `I don't have a team member matching "${intent.assignee_name ?? ''}".`;
      await prisma.task.update({ where: { id: task.id }, data: { assigneeId: assignee.id } });
      await prisma.taskHistory.create({
        data: {
          taskId: task.id,
          actorId: senderUser.id,
          action: 'assigned',
          metadata: { from: task.assigneeId, to: assignee.id, source: 'whatsapp' },
        },
      });
      return `✅ Reassigned "${task.title}" to ${assignee.name ?? 'them'}.`;
    }

    case 'list_pending': {
      const tasks = await prisma.task.findMany({
        where: {
          organizationId: organization.id,
          deletedAt: null,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          ...(senderUser ? { assigneeId: senderUser.id } : {}),
        },
        orderBy: [{ dueAt: 'asc' }, { priority: 'desc' }],
        take: 10,
      });
      if (!tasks.length) return '✨ Nothing pending.';
      return (
        '📋 Pending:\n' +
        tasks.map((t, i) => `${i + 1}. ${t.title}${t.dueAt ? ` (due ${t.dueAt.toDateString()})` : ''}`).join('\n')
      );
    }

    case 'list_overdue': {
      const tasks = await prisma.task.findMany({
        where: {
          organizationId: organization.id,
          deletedAt: null,
          dueAt: { lt: new Date() },
          status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] },
        },
        include: { assignee: { select: { name: true } } },
        orderBy: { dueAt: 'asc' },
        take: 10,
      });
      if (!tasks.length) return '🎉 No overdue tasks.';
      return (
        '🚨 Overdue:\n' +
        tasks.map((t, i) => `${i + 1}. ${t.title} — ${t.assignee?.name ?? 'unassigned'}`).join('\n')
      );
    }

    case 'list_blocked': {
      const tasks = await prisma.task.findMany({
        where: { organizationId: organization.id, deletedAt: null, status: 'BLOCKED' },
        include: { assignee: { select: { name: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      });
      if (!tasks.length) return '✅ Nothing blocked right now.';
      return (
        '⚠️ Blocked:\n' +
        tasks
          .map((t, i) => `${i + 1}. ${t.title}${t.blockedReason ? ` — ${t.blockedReason}` : ''}`)
          .join('\n')
      );
    }

    case 'summary_today': {
      const stats = await computeDailyStats(organization.id);
      return (
        `📊 Today at ${organization.name}\n` +
        `• Completed: ${stats.completedToday}\n` +
        `• Created: ${stats.createdToday}\n` +
        `• Due today: ${stats.dueToday}\n` +
        `• Overdue: ${stats.overdueNow}\n` +
        `• Blocked: ${stats.blockedNow}`
      );
    }

    case 'summary_week': {
      const { summary } = await generateWeeklySummary(organization.id, organization.name);
      return summary;
    }

    case 'bottlenecks': {
      const findings = await detectBottlenecks(organization.id);
      if (!findings.length) return '✅ No bottlenecks detected in the last 14 days.';
      const factPack = findings.map((f) => `- [${f.severity}] ${f.title}: ${f.description}`).join('\n');
      const narrative = await callClaudeText({
        system: BOTTLENECK_SYSTEM,
        user: `Findings:\n${factPack}\n\nExplain to the owner and suggest next actions.`,
        maxTokens: 400,
      });
      return narrative ?? `⚠️ Bottlenecks:\n${factPack}`;
    }

    case 'remind_team': {
      // Deterministic reminder list
      const dueToday = await prisma.task.count({
        where: {
          organizationId: organization.id,
          deletedAt: null,
          dueAt: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) },
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
      });
      return `🔔 Reminder: ${dueToday} task(s) due today. Check the dashboard for details.`;
    }

    case 'unknown':
    default:
      return intent.reply_message || 'I didn\'t catch that. Try "help" to see what I can do.';
  }
}
