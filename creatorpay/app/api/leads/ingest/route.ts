/**
 * POST /api/leads/ingest
 *
 * Webhook endpoint for leads-db (or any external pipeline) to push
 * enriched company records directly into the FreeMe lead pipeline.
 *
 * Configure leads-db to POST to this URL with header:
 *   x-ingest-secret: <SCRAPE_SECRET>
 *
 * Accepts a single company object OR an array.
 */

import { NextRequest, NextResponse } from 'next/server'
import { leadsDb } from '@/lib/supabase/leads'
import { guessIndustry, guessLocation, normalizePhone, isValidEmailFormat, isDuplicate } from '@/lib/scraper/validate'

const SECRET = process.env.SCRAPE_SECRET ?? ''

interface InboundCompany {
  name?:             string
  company_name?:     string
  domain?:           string
  website?:          string
  email?:            string
  phone?:            string
  industry?:         string
  locality?:         string
  location?:         string
  country?:          string
  description?:      string
  linkedin_url?:     string
  twitter_url?:      string
  employees_count?:  number
  instagram_handle?: string
  followers_count?:  number
  first_name?:       string
  last_name?:        string
  title?:            string
}

function mapCompany(c: InboundCompany) {
  const name = c.company_name || c.name || c.domain
  if (!name) return null

  const textForGuess = `${name} ${c.industry ?? ''} ${c.description ?? ''}`
  const industry = guessIndustry(textForGuess)
  const location = guessLocation(`${c.locality ?? ''} ${c.location ?? ''} ${c.country ?? ''}`)
  const isNigeria = (c.country ?? '').toLowerCase().includes('nigeria')
  const isLagosArea = ['lekki', 'victoria_island', 'ikoyi', 'yaba', 'other_lagos'].includes(location)

  if (!isLagosArea && !isNigeria) return null

  const phone = c.phone ? normalizePhone(c.phone) : null
  const email = c.email && isValidEmailFormat(c.email) ? c.email.toLowerCase() : null

  return {
    company_name:         name,
    first_name:           c.first_name           ?? null,
    last_name:            c.last_name            ?? null,
    decision_maker_title: c.title                ?? null,
    email,
    phone,
    website:   c.website ?? (c.domain ? `https://${c.domain}` : null),
    instagram_handle: c.instagram_handle         ?? null,
    followers_count:  c.followers_count          ?? 0,
    industry:  industry as 'music' | 'film' | 'photography' | 'podcast' | 'advertising' | 'events' | 'real_estate' | 'corporate' | 'diaspora' | 'other',
    location:  location as 'lekki' | 'victoria_island' | 'ikoyi' | 'yaba' | 'other_lagos' | 'international',
    source:    'directory' as const,
    has_website:    Boolean(c.website || c.domain),
    recent_activity:false,
    is_diaspora:    false,
    notes: [
      c.description  ? `Bio: ${c.description.slice(0, 200)}`  : null,
      c.linkedin_url ? `LinkedIn: ${c.linkedin_url}`           : null,
      c.employees_count ? `~${c.employees_count} employees`    : null,
    ].filter(Boolean).join(' | ') || null,
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-ingest-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (SECRET && secret !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const companies: InboundCompany[] = Array.isArray(body) ? body : [body]

  let inserted = 0
  let skipped  = 0
  const errors: string[] = []

  for (const c of companies) {
    try {
      const lead = mapCompany(c)
      if (!lead) { skipped++; continue }

      if (await isDuplicate(lead.email, lead.phone)) { skipped++; continue }

      const { error } = await leadsDb.from('freeme_leads').insert(lead)
      if (error) { errors.push(error.message); continue }
      inserted++
    } catch (err) {
      errors.push(String(err))
    }
  }

  return NextResponse.json({
    received: companies.length,
    inserted,
    skipped,
    errors: errors.slice(0, 10),
  })
}
