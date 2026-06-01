import { prisma } from '@/lib/db';
import { subDays, differenceInHours } from 'date-fns';

export type Bottleneck = {
  kind:
    | 'overdue_cluster'
    | 'blocked_pile'
    | 'assignee_overload'
    | 'slow_stage'
    | 'repeat_overdue'
    | 'stale_in_progress';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  data: Record<string, unknown>;
};

/**
 * Deterministic bottleneck detection over the last 14 days of task data.
 * Claude is used separately to *narrate* the findings, never to invent them.
 */
export async function detectBottlenecks(organizationId: string): Promise<Bottleneck[]> {
  const since = subDays(new Date(), 14);
  const tasks = await prisma.task.findMany({
    where: {
      organizationId,
      deletedAt: null,
      OR: [{ createdAt: { gte: since } }, { status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] } }],
    },
    include: {
      assignee: { select: { id: true, name: true } },
      stage: { select: { id: true, name: true, slaHours: true } },
      workflow: { select: { id: true, name: true } },
    },
  });

  const now = new Date();
  const findings: Bottleneck[] = [];

  // 1) Overdue cluster: >5 overdue open tasks
  const overdue = tasks.filter(
    (t) => t.dueAt && t.dueAt < now && !['DONE', 'CANCELED'].includes(t.status),
  );
  if (overdue.length >= 5) {
    findings.push({
      kind: 'overdue_cluster',
      severity: overdue.length >= 15 ? 'CRITICAL' : 'WARNING',
      title: `${overdue.length} overdue tasks piling up`,
      description: `There are ${overdue.length} open tasks past their due date.`,
      data: { count: overdue.length, sample: overdue.slice(0, 5).map((t) => ({ id: t.id, title: t.title })) },
    });
  }

  // 2) Blocked pile: >3 tasks stuck in BLOCKED for >24h
  const blocked = tasks.filter(
    (t) => t.status === 'BLOCKED' && differenceInHours(now, t.updatedAt) >= 24,
  );
  if (blocked.length >= 3) {
    findings.push({
      kind: 'blocked_pile',
      severity: 'WARNING',
      title: `${blocked.length} tasks blocked over 24h`,
      description: `Tasks are sitting in BLOCKED without movement.`,
      data: {
        count: blocked.length,
        reasons: [...new Set(blocked.map((t) => t.blockedReason).filter(Boolean))].slice(0, 5),
      },
    });
  }

  // 3) Assignee overload: >10 open tasks on one person
  const byAssignee = new Map<string, { name: string | null; count: number }>();
  for (const t of tasks) {
    if (!t.assigneeId || ['DONE', 'CANCELED'].includes(t.status)) continue;
    const prev = byAssignee.get(t.assigneeId);
    byAssignee.set(t.assigneeId, {
      name: t.assignee?.name ?? null,
      count: (prev?.count ?? 0) + 1,
    });
  }
  for (const [userId, { name, count }] of byAssignee) {
    if (count >= 10) {
      findings.push({
        kind: 'assignee_overload',
        severity: count >= 20 ? 'CRITICAL' : 'WARNING',
        title: `${name ?? 'A teammate'} has ${count} open tasks`,
        description: `Workload may be unevenly distributed. Consider reassigning.`,
        data: { userId, name, count },
      });
    }
  }

  // 4) Slow stage: average time on stage > 2x SLA
  const stageStats = new Map<string, { name: string; slaHours: number | null; totalHours: number; n: number }>();
  for (const t of tasks) {
    if (!t.stage || !t.stage.slaHours) continue;
    const hrs = differenceInHours(t.updatedAt, t.createdAt);
    const s = stageStats.get(t.stage.id);
    stageStats.set(t.stage.id, {
      name: t.stage.name,
      slaHours: t.stage.slaHours,
      totalHours: (s?.totalHours ?? 0) + hrs,
      n: (s?.n ?? 0) + 1,
    });
  }
  for (const [stageId, s] of stageStats) {
    if (!s.slaHours || s.n < 3) continue;
    const avg = s.totalHours / s.n;
    if (avg > s.slaHours * 2) {
      findings.push({
        kind: 'slow_stage',
        severity: 'WARNING',
        title: `"${s.name}" stage is running 2× over target`,
        description: `Average time on stage is ${avg.toFixed(1)}h vs target ${s.slaHours}h.`,
        data: { stageId, avgHours: Number(avg.toFixed(1)), slaHours: s.slaHours, sample: s.n },
      });
    }
  }

  // 5) Stale IN_PROGRESS: not updated in 3+ days
  const stale = tasks.filter(
    (t) => t.status === 'IN_PROGRESS' && differenceInHours(now, t.updatedAt) >= 72,
  );
  if (stale.length >= 3) {
    findings.push({
      kind: 'stale_in_progress',
      severity: 'INFO',
      title: `${stale.length} tasks in progress with no update in 3+ days`,
      description: `Follow-ups may be needed to keep these moving.`,
      data: { count: stale.length, sample: stale.slice(0, 5).map((t) => ({ id: t.id, title: t.title })) },
    });
  }

  return findings;
}

/**
 * Persist findings as Alert records, avoiding duplicates within 24h of the same kind.
 */
export async function persistBottleneckAlerts(organizationId: string, findings: Bottleneck[]) {
  const recent = await prisma.alert.findMany({
    where: { organizationId, createdAt: { gte: subDays(new Date(), 1) } },
    select: { kind: true, title: true },
  });
  const seen = new Set(recent.map((r) => `${r.kind}::${r.title}`));
  const fresh = findings.filter((f) => !seen.has(`${f.kind}::${f.title}`));
  if (!fresh.length) return 0;
  await prisma.alert.createMany({
    data: fresh.map((f) => ({
      organizationId,
      kind: f.kind,
      severity: f.severity,
      title: f.title,
      description: f.description,
      data: f.data as any,
    })),
  });
  return fresh.length;
}
