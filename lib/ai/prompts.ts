import { z } from 'zod';

/**
 * Intent schema for parsing WhatsApp / natural-language messages.
 * Claude returns ONE of these intents with its supporting fields.
 */
export const IntentSchema = z.object({
  intent: z.enum([
    'create_task',
    'update_task_status',
    'reassign_task',
    'list_pending',
    'list_overdue',
    'list_blocked',
    'summary_today',
    'summary_week',
    'bottlenecks',
    'remind_team',
    'help',
    'unknown',
  ]),
  task_title: z.string().nullable().optional(),
  task_description: z.string().nullable().optional(),
  assignee_name: z.string().nullable().optional(),
  due_date_iso: z.string().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).nullable().optional(),
  new_status: z.enum(['PENDING', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELED']).nullable().optional(),
  task_reference: z.string().nullable().optional(),
  needs_clarification: z.boolean().default(false),
  reply_message: z.string().min(1),
});
export type Intent = z.infer<typeof IntentSchema>;

export const INTENT_SYSTEM_PROMPT = `You are the natural-language parser for Devrabyte AI Ops, an operations platform for African SMEs used over WhatsApp.

Your job: parse the user's message and return ONE structured JSON object matching the schema.

Guidelines:
- Today's date context will be provided; interpret relative dates ("tomorrow", "next Monday morning") into ISO 8601 (UTC).
- If the user asks to create a task, extract a clean task_title, optional description, assignee name (as written), due date, priority.
- If the message references an existing task (e.g. "mark the ABC follow-up as done"), set task_reference to the best phrase identifying it.
- If the user asks for a summary/overdue/blocked/bottlenecks, set the right listing intent.
- If the message is unclear, set needs_clarification=true and ask for the missing info in reply_message.
- reply_message is a short, friendly WhatsApp-style reply (1-2 short lines, no emoji spam).
- Never invent assignees or task IDs.
- If you don't understand, use intent="unknown" and ask a helpful clarifying question.

Priority defaults:
- "urgent", "asap", "now" → URGENT
- "important", "high" → HIGH
- default → MEDIUM

Return ONLY the JSON object.`;

export function buildIntentUserPrompt(args: {
  message: string;
  orgName: string;
  senderName?: string | null;
  teamMembers: { name: string | null; phone: string | null }[];
  nowIso: string;
  timezone: string;
}) {
  const roster = args.teamMembers
    .filter((m) => m.name)
    .map((m) => `- ${m.name}${m.phone ? ` (${m.phone})` : ''}`)
    .join('\n');
  return `Organization: ${args.orgName}
Sender: ${args.senderName ?? 'unknown'}
Now (ISO): ${args.nowIso}
Timezone: ${args.timezone}

Known team members:
${roster || '(none yet)'}

User message:
"""
${args.message}
"""`;
}

/* ------------------------------------------------------------------ */
/* Summary + bottleneck prompts                                       */
/* ------------------------------------------------------------------ */

export const SUMMARY_SYSTEM = `You write concise, friendly daily/weekly operations summaries for an SME team lead.
Tone: clear, professional, warm. No fluff. 3-6 short bullet-style lines separated by newlines.
Always end with ONE actionable suggestion prefixed "👉".
Never invent data that isn't in the input.`;

export const BOTTLENECK_SYSTEM = `You analyze operations data for bottlenecks and explain them plainly.
Given structured stats, write 2-4 short sentences: WHAT is stuck, WHY it appears stuck, and WHAT to try next.
No jargon. No invented numbers.`;
