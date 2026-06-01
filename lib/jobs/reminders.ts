import { prisma } from '@/lib/db';
import { sendWhatsAppText } from '@/lib/wa/client';
import { subHours } from 'date-fns';

/**
 * Walk all pending reminders due up to `now` and send them. Marks sent on success.
 * Returns count of reminders processed.
 */
export async function processDueReminders(now = new Date()): Promise<number> {
  const due = await prisma.reminder.findMany({
    where: { sent: false, remindAt: { lte: now } },
    include: {
      task: {
        include: {
          assignee: { select: { id: true, name: true, phone: true } },
          organization: { select: { id: true, name: true } },
        },
      },
    },
    take: 200,
  });

  let sent = 0;
  for (const r of due) {
    try {
      if (r.task?.assignee?.phone) {
        const body =
          r.body ||
          `⏰ Reminder: "${r.task.title}" is due ${
            r.task.dueAt ? r.task.dueAt.toLocaleString() : 'soon'
          }.`;
        await sendWhatsAppText(r.task.assignee.phone, body);
      }
      await prisma.reminder.update({
        where: { id: r.id },
        data: { sent: true, sentAt: new Date() },
      });
      sent++;
    } catch (err) {
      console.error('[reminder] failed', r.id, err);
    }
  }
  return sent;
}

/**
 * Auto-generate reminders from SLA on workflow stages.
 * For each task that has a stage with reminderHours and a due date, ensure a reminder
 * exists at (dueAt - reminderHours). Idempotent per task.
 */
export async function ensureStageReminders(organizationId: string) {
  const tasks = await prisma.task.findMany({
    where: {
      organizationId,
      deletedAt: null,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      dueAt: { not: null },
      stageId: { not: null },
    },
    include: { stage: true, reminders: true },
  });

  let created = 0;
  for (const t of tasks) {
    if (!t.stage?.reminderHours || !t.dueAt || !t.assigneeId) continue;
    const remindAt = subHours(t.dueAt, t.stage.reminderHours);
    if (remindAt < new Date()) continue; // already past
    const exists = t.reminders.some(
      (r) => Math.abs(r.remindAt.getTime() - remindAt.getTime()) < 60_000,
    );
    if (exists) continue;

    await prisma.reminder.create({
      data: {
        organizationId,
        taskId: t.id,
        userId: t.assigneeId,
        remindAt,
        body: `⏰ "${t.title}" is due ${t.dueAt.toLocaleString()}.`,
      },
    });
    created++;
  }
  return created;
}
