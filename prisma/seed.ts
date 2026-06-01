/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays, subDays, subHours } from 'date-fns';
import { WORKFLOW_TEMPLATES } from '../lib/workflows/templates';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Devrabyte AI Ops demo data...');

  const passwordHash = await bcrypt.hash('demo1234', 12);

  // Super admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@devrabyte.ai' },
    create: {
      email: 'admin@devrabyte.ai',
      name: 'Platform Admin',
      passwordHash,
      isSuperAdmin: true,
    },
    update: { isSuperAdmin: true },
  });

  // Owner user for demo org
  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.devrabyte.ai' },
    create: {
      email: 'owner@demo.devrabyte.ai',
      name: 'Adaeze Okafor',
      passwordHash,
      phone: '+2348000000001',
    },
    update: {},
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo.devrabyte.ai' },
    create: {
      email: 'manager@demo.devrabyte.ai',
      name: 'Tunde Balogun',
      passwordHash,
      phone: '+2348000000002',
    },
    update: {},
  });

  const mary = await prisma.user.upsert({
    where: { email: 'mary@demo.devrabyte.ai' },
    create: {
      email: 'mary@demo.devrabyte.ai',
      name: 'Mary Johnson',
      passwordHash,
      phone: '+2348000000003',
    },
    update: {},
  });

  const kwame = await prisma.user.upsert({
    where: { email: 'kwame@demo.devrabyte.ai' },
    create: {
      email: 'kwame@demo.devrabyte.ai',
      name: 'Kwame Mensah',
      passwordHash,
      phone: '+2348000000004',
    },
    update: {},
  });

  // Demo org
  const org = await prisma.organization.upsert({
    where: { slug: 'brightlabs' },
    create: {
      name: 'BrightLabs Consulting',
      slug: 'brightlabs',
      industry: 'Professional Services',
      teamSize: '6-20',
      timezone: 'Africa/Lagos',
      dailySummaryAt: '08:00',
      plan: 'GROWTH',
      trialEndsAt: addDays(new Date(), 14),
      settings: { create: {} },
    },
    update: {},
  });

  // Memberships
  for (const [user, role] of [
    [owner, 'OWNER'],
    [manager, 'ADMIN'],
    [mary, 'MEMBER'],
    [kwame, 'MEMBER'],
  ] as const) {
    await prisma.membership.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
      create: { userId: user.id, organizationId: org.id, role },
      update: { role },
    });
  }

  // Workflows from 2 templates
  const templatesToSeed = WORKFLOW_TEMPLATES.filter((t) =>
    ['sales_followup', 'client_onboarding'].includes(t.key),
  );

  const workflowIdByKey = new Map<string, { id: string; stageIdByName: Map<string, string> }>();
  for (const tpl of templatesToSeed) {
    const existing = await prisma.workflow.findFirst({
      where: { organizationId: org.id, templateKey: tpl.key, deletedAt: null },
      include: { stages: true },
    });
    if (existing) {
      const m = new Map<string, string>();
      for (const s of existing.stages) m.set(s.name, s.id);
      workflowIdByKey.set(tpl.key, { id: existing.id, stageIdByName: m });
      continue;
    }
    const wf = await prisma.workflow.create({
      data: {
        organizationId: org.id,
        name: tpl.name,
        description: tpl.description,
        templateKey: tpl.key,
        stages: {
          create: tpl.stages.map((s) => ({
            name: s.name,
            order: s.order,
            slaHours: s.slaHours ?? null,
            reminderHours: s.reminderHours ?? null,
            requiresApproval: s.requiresApproval ?? false,
          })),
        },
      },
      include: { stages: true },
    });
    const m = new Map<string, string>();
    for (const s of wf.stages) m.set(s.name, s.id);
    workflowIdByKey.set(tpl.key, { id: wf.id, stageIdByName: m });
  }

  const sales = workflowIdByKey.get('sales_followup')!;
  const onboard = workflowIdByKey.get('client_onboarding')!;

  // Clear + reseed tasks
  await prisma.task.deleteMany({ where: { organizationId: org.id } });

  const now = new Date();
  const tasksToCreate: any[] = [
    // Sales follow-up tasks
    {
      title: 'Follow up with ABC Manufacturing on proposal',
      description: 'They asked for clarifications on payment terms.',
      assigneeId: mary.id,
      createdById: owner.id,
      workflowId: sales.id,
      stageId: sales.stageIdByName.get('Proposal Sent'),
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueAt: subHours(now, 5), // overdue
    },
    {
      title: 'Send follow-up email to Lagos Logistics',
      assigneeId: mary.id,
      createdById: owner.id,
      workflowId: sales.id,
      stageId: sales.stageIdByName.get('First Contact'),
      priority: 'MEDIUM',
      status: 'PENDING',
      dueAt: addDays(now, 1),
    },
    {
      title: 'Qualify inbound lead: Kano Retail Ltd',
      assigneeId: kwame.id,
      createdById: manager.id,
      workflowId: sales.id,
      stageId: sales.stageIdByName.get('New Lead'),
      priority: 'URGENT',
      status: 'PENDING',
      dueAt: addDays(now, 0),
    },
    // Onboarding tasks
    {
      title: 'Kickoff call with Zenith Imports',
      assigneeId: manager.id,
      createdById: owner.id,
      workflowId: onboard.id,
      stageId: onboard.stageIdByName.get('Welcome & Kickoff'),
      priority: 'HIGH',
      status: 'DONE',
      completedAt: subDays(now, 1),
      dueAt: subDays(now, 2),
    },
    {
      title: 'Collect requirements doc from Zenith',
      assigneeId: manager.id,
      createdById: owner.id,
      workflowId: onboard.id,
      stageId: onboard.stageIdByName.get('Collect Requirements'),
      priority: 'HIGH',
      status: 'BLOCKED',
      blockedReason: 'Waiting for signed NDA from client legal',
      dueAt: subDays(now, 1),
    },
    {
      title: 'Configure billing integration for Zenith',
      assigneeId: kwame.id,
      createdById: manager.id,
      workflowId: onboard.id,
      stageId: onboard.stageIdByName.get('Setup & Config'),
      priority: 'MEDIUM',
      status: 'PENDING',
      dueAt: addDays(now, 3),
    },
    // Ad-hoc tasks
    {
      title: 'Prepare Q2 board update deck',
      assigneeId: owner.id,
      createdById: owner.id,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueAt: addDays(now, 2),
    },
    {
      title: 'Update invoice template with new VAT',
      assigneeId: manager.id,
      createdById: owner.id,
      priority: 'LOW',
      status: 'DONE',
      completedAt: subDays(now, 2),
      dueAt: subDays(now, 3),
    },
    {
      title: 'Respond to customer support ticket #4521',
      assigneeId: mary.id,
      createdById: manager.id,
      priority: 'URGENT',
      status: 'PENDING',
      dueAt: subHours(now, 2), // overdue
    },
    {
      title: 'Staff monthly 1:1s',
      assigneeId: owner.id,
      createdById: owner.id,
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      dueAt: addDays(now, 5),
    },
  ];

  for (const t of tasksToCreate) {
    const created = await prisma.task.create({ data: { organizationId: org.id, ...t } });
    await prisma.taskHistory.create({
      data: { taskId: created.id, actorId: t.createdById, action: 'created' },
    });
  }

  // A few activity events for the feed
  const tasks = await prisma.task.findMany({ where: { organizationId: org.id } });
  for (const t of tasks.slice(0, 6)) {
    await prisma.activityEvent.create({
      data: {
        organizationId: org.id,
        actorId: t.createdById,
        kind: 'task.created',
        summary: `Task "${t.title}" created`,
        data: { taskId: t.id },
      },
    });
  }

  console.log('✅ Seed complete.');
  console.log('   Super admin:  admin@devrabyte.ai       / demo1234');
  console.log('   Demo owner:   owner@demo.devrabyte.ai  / demo1234');
  console.log('   Demo member:  mary@demo.devrabyte.ai   / demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
