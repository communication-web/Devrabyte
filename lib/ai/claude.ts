import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-7';

let client: Anthropic | null = null;

export function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

/**
 * Call Claude and request a JSON-only response.
 * Always validates with a Zod schema before trusting the output.
 */
export async function callClaudeJson<T>(opts: {
  system: string;
  user: string;
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: unknown } };
  maxTokens?: number;
  temperature?: number;
}): Promise<{ ok: true; data: T } | { ok: false; reason: string; raw?: string }> {
  const a = anthropic();
  if (!a) return { ok: false, reason: 'AI_UNAVAILABLE' };

  try {
    const resp = await a.messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0,
      system:
        opts.system +
        '\n\nCRITICAL: Respond ONLY with a single JSON object. No prose, no markdown, no code fences.',
      messages: [{ role: 'user', content: opts.user }],
    });

    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    // Strip any accidental fences
    const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

    let json: unknown;
    try {
      json = JSON.parse(cleaned);
    } catch {
      return { ok: false, reason: 'INVALID_JSON', raw: cleaned };
    }

    const parsed = opts.schema.safeParse(json);
    if (!parsed.success) return { ok: false, reason: 'SCHEMA_FAIL', raw: cleaned };
    return { ok: true, data: parsed.data as T };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'AI_ERROR' };
  }
}

/**
 * Plain text Claude call for summaries / narrative output.
 */
export async function callClaudeText(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string | null> {
  const a = anthropic();
  if (!a) return null;
  try {
    const resp = await a.messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 800,
      system: opts.system,
      messages: [{ role: 'user', content: opts.user }],
    });
    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    return text || null;
  } catch {
    return null;
  }
}
