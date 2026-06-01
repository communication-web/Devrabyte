import { z } from 'zod';

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(80),
  orgName: z.string().min(1).max(80),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(240),
  description: z.string().max(4000).optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  workflowId: z.string().cuid().optional().nullable(),
  stageId: z.string().cuid().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  tags: z.array(z.string()).max(16).default([]),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(240).optional(),
  description: z.string().max(4000).optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  workflowId: z.string().cuid().optional().nullable(),
  stageId: z.string().cuid().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELED']).optional(),
  blockedReason: z.string().max(500).optional().nullable(),
  tags: z.array(z.string()).max(16).optional(),
});

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional().nullable(),
  templateKey: z.string().max(64).optional().nullable(),
  stages: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        order: z.number().int().min(0).max(99),
        slaHours: z.number().int().min(0).max(720).optional().nullable(),
        reminderHours: z.number().int().min(0).max(720).optional().nullable(),
        requiresApproval: z.boolean().default(false),
      }),
    )
    .min(1)
    .max(20),
});

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER']).default('MEMBER'),
});

export const OnboardingSchema = z.object({
  industry: z.string().max(80).optional().nullable(),
  teamSize: z.string().max(40).optional().nullable(),
  dailySummaryAt: z.string().regex(/^\d{2}:\d{2}$/).default('08:00'),
  timezone: z.string().max(64).default('Africa/Lagos'),
  templateKey: z.string().max(64).optional().nullable(),
});
