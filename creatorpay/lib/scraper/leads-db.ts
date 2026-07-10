/**
 * leads-db integration — polls the Flask API for NRDs and enriched companies,
 * filters to Lagos creative businesses, and returns LeadInsert records.
 *
 * Required env vars:
 *   LEADS_DB_URL      — base URL of the running leads-db Flask server
 *   LEADS_DB_API_KEY  — optional bearer token if you add auth to leads-db
 *
 * leads-db repo: https://github.com/IsaacBell/leads-db
 */

import { enrichCompany } from './abstract-api'
import { guessIndustry, guessLocation } from './validate'
import type { LeadInsert, ScraperResult } from './types'

const LEADS_DB_URL = process.env.LEADS_DB_URL ?? ''
const LEADS_DB_KEY = process.env.LEADS_DB_API_KEY ?? ''

// Nigerian TLDs and Lagos keywords used to filter NRDs
const NG_TLDS       = ['.ng', '.com.ng', '.org.ng', '.net.ng']
const LAGOS_SIGNALS = ['lagos', 'lekki', 'vi', 'ikoyi', 'yaba', 'nigeria', 'naija', 'nollywood']
const CREATIVE_SIGNALS = [
  'studio', 'music', 'sound', 'record', 'film', 'media', 'photo',
  'creative', 'brand', 'event', 'podcast', 'production', 'agency',
  'design', 'content', 'digital', 'entertainment', 'fashion',
]

function isRelevantDomain(domain: string): boolean {
  const d = domain.toLowerCase()
  const hasNgTld   = NG_TLDS.some((tld) => d.endsWith(tld))
  const hasLagos   = LAGOS_SIGNALS.some((s) => d.includes(s))
  const hasCreative = CREATIVE_SIGNALS.some((s) => d.includes(s))
  return hasNgTld || hasLagos || hasCreative
}

function headers() {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (LEADS_DB_KEY) h['Authorization'] = `Bearer ${LEADS_DB_KEY}`
  return h
}

// ─── Fetch today's NRDs from leads-db ────────────────────────────────────────

interface NRD { domain: string; registered_at?: string }

async function fetchNRDs(): Promise<NRD[]> {
  const res = await fetch(`${LEADS_DB_URL}/api/v1/_system/ingestions`, {
    headers: headers(),
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`NRD fetch failed: ${res.status}`)
  const data = await res.json()
  // leads-db returns { domains: [...] } or array directly
  return Array.isArray(data) ? data : (data.domains ?? [])
}

// ─── Fetch companies from leads-db ───────────────────────────────────────────

interface LeadsDbCompany {
  id?:       string
  name?:     string
  domain?:   string
  industry?: string
  locality?: string
  country?:  string
  phone?:    string
  email?:    string
  website?:  string
  linkedin_url?: string
  description?: string
  employees_count?: number
}

async function fetchCompanies(limit = 100): Promise<LeadsDbCompany[]> {
  const res = await fetch(`${LEADS_DB_URL}/api/v1/companies?limit=${limit}`, {
    headers: headers(),
    next: { revalidate: 0 },
  })
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : (data.companies ?? [])
}

// ─── Map Abstract/leads-db company → LeadInsert ───────────────────────────────

function companyToLead(c: LeadsDbCompany): LeadInsert | null {
  const name = c.name || c.domain
  if (!name) return null

  const textForGuess = `${name} ${c.industry ?? ''} ${c.description ?? ''}`
  const industry = guessIndustry(textForGuess) as LeadInsert['industry']
  const location = guessLocation(`${c.locality ?? ''} ${c.country ?? ''}`) as LeadInsert['location']
  const isLagos  = ['lekki', 'victoria_island', 'ikoyi', 'yaba', 'other_lagos'].includes(location)
  const isNigeria = (c.country ?? '').toLowerCase().includes('nigeria')

  // Only import Lagos / Nigeria companies
  if (!isLagos && !isNigeria) return null

  return {
    company_name:    name,
    email:           c.email,
    phone:           c.phone,
    website:         c.website ?? (c.domain ? `https://${c.domain}` : undefined),
    industry,
    location,
    source:          'directory',
    has_website:     Boolean(c.domain || c.website),
    recent_activity: false,
    is_diaspora:     false,
    notes: [
      c.description ? `Bio: ${c.description.slice(0, 200)}` : null,
      c.linkedin_url ? `LinkedIn: ${c.linkedin_url}` : null,
      c.employees_count ? `~${c.employees_count} employees` : null,
    ].filter(Boolean).join(' | ') || undefined,
  }
}

// ─── Main scraper ─────────────────────────────────────────────────────────────

export async function scrapeLeadsDb(): Promise<ScraperResult> {
  if (!LEADS_DB_URL) {
    return { source: 'directory', found: 0, leads: [], error: 'LEADS_DB_URL not set' }
  }

  const leads: LeadInsert[] = []

  try {
    // 1 — Pull today's NRDs, enrich relevant ones via Abstract API
    const nrds = await fetchNRDs()
    const relevant = nrds.filter((n) => isRelevantDomain(n.domain))

    for (const nrd of relevant.slice(0, 30)) {
      await new Promise((r) => setTimeout(r, 1200)) // rate limit
      const enriched = await enrichCompany(nrd.domain)
      if (!enriched) continue

      const lead = companyToLead({
        name:      enriched.name,
        domain:    enriched.domain,
        industry:  enriched.industry,
        locality:  enriched.locality,
        country:   enriched.country,
        phone:     enriched.phone,
        email:     enriched.email,
        linkedin_url: enriched.linkedin_url,
        description: enriched.description,
        employees_count: enriched.employees_count,
      })
      if (lead) leads.push(lead)
    }

    // 2 — Pull recently added companies from leads-db directly
    const companies = await fetchCompanies(100)
    for (const c of companies) {
      const lead = companyToLead(c)
      if (lead) leads.push(lead)
    }

    return { source: 'directory', found: leads.length, leads }
  } catch (err) {
    return { source: 'directory', found: leads.length, leads, error: String(err) }
  }
}
