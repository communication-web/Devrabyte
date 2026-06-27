import { leadsDb } from '@/lib/supabase/leads'

// ─── Phone normalisation ────────────────────────────────────────────────────
// Converts any Nigerian number format to E.164: +234XXXXXXXXXX

export function normalizePhone(raw: string): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')

  // Already E.164 without +
  if (digits.startsWith('234') && digits.length === 13) return `+${digits}`
  // Local 0XX format
  if (digits.startsWith('0') && digits.length === 11) return `+234${digits.slice(1)}`
  // Already correct length without country code
  if (digits.length === 10) return `+234${digits}`

  return null
}

// ─── Email validation ────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_RE.test(email.trim().toLowerCase())
}

// ─── Deduplication ──────────────────────────────────────────────────────────
// Returns true if a lead with this email OR phone already exists

export async function isDuplicate(email: string | null, phone: string | null): Promise<boolean> {
  if (!email && !phone) return false

  const conditions: string[] = []
  if (email) conditions.push(`email.eq.${email.toLowerCase()}`)
  if (phone) conditions.push(`phone.eq.${phone}`)

  const { data } = await leadsDb
    .from('freeme_leads')
    .select('id')
    .or(conditions.join(','))
    .limit(1)

  return (data?.length ?? 0) > 0
}

// ─── Industry classifier ─────────────────────────────────────────────────────
// Best-effort industry guess from a business name / description

const INDUSTRY_PATTERNS: [RegExp, string][] = [
  [/record|studio|music|sound|beat|produc|label|artiste|artist/i, 'music'],
  [/film|nollywood|movie|cinema|video produc|tv produc/i,          'film'],
  [/photo|portrait|shoot|fashion|model/i,                          'photography'],
  [/podcast|talk show|broadcast|radio/i,                           'podcast'],
  [/advertis|brand|agenc|market|pr firm|public relat/i,            'advertising'],
  [/event|wedding|concert|show|plann/i,                            'events'],
  [/real estate|property|develop|realt/i,                          'real_estate'],
  [/corporate|consult|firm|services|solutions/i,                   'corporate'],
]

export function guessIndustry(text: string): string {
  for (const [re, industry] of INDUSTRY_PATTERNS) {
    if (re.test(text)) return industry
  }
  return 'other'
}

// ─── Location classifier ─────────────────────────────────────────────────────

export function guessLocation(address: string): string {
  const a = address.toLowerCase()
  if (a.includes('lekki'))            return 'lekki'
  if (a.includes('victoria island') || a.includes('v.i') || a.includes('vi ')) return 'victoria_island'
  if (a.includes('ikoyi'))            return 'ikoyi'
  if (a.includes('yaba'))             return 'yaba'
  if (a.includes('lagos'))            return 'other_lagos'
  return 'other_lagos'
}
