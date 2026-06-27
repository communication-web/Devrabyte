import { leadsDb } from '@/lib/supabase/leads'
import { isDuplicate, isValidEmailFormat, normalizePhone } from './validate'
import { scrapeGoogleMaps } from './google-maps'
import { scrapeInstagram } from './instagram'
import type { LeadInsert, PipelineResult, ScraperResult } from './types'

type Source = 'google_maps' | 'instagram'

const SCRAPERS: Record<Source, () => Promise<ScraperResult>> = {
  google_maps: scrapeGoogleMaps,
  instagram:   scrapeInstagram,
}

// ─── Create / finish run records ─────────────────────────────────────────────

async function startRun(sources: Source[]): Promise<string> {
  const { data, error } = await leadsDb
    .from('freeme_scrape_runs')
    .insert({ sources_run: sources, status: 'running' })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create run record: ${error.message}`)
  return data.id
}

async function finishRun(
  runId:  string,
  result: Omit<PipelineResult, 'run_id'>,
  log:    object[],
) {
  await leadsDb
    .from('freeme_scrape_runs')
    .update({
      status:          result.error ? 'failed' : 'completed',
      completed_at:    new Date().toISOString(),
      total_found:     result.total_found,
      total_inserted:  result.total_inserted,
      total_duplicates:result.total_duplicates,
      tier1_found:     result.tier1_found,
      tier2_found:     result.tier2_found,
      tier3_found:     result.tier3_found,
      error_message:   result.error ?? null,
      log,
    })
    .eq('id', runId)
}

// ─── Insert one lead, returns tier if inserted or null if duplicate ───────────

async function insertLead(lead: LeadInsert): Promise<number | null> {
  // Normalise
  if (lead.phone) lead.phone = normalizePhone(lead.phone) ?? undefined
  if (lead.email) {
    lead.email = lead.email.toLowerCase().trim()
    if (!isValidEmailFormat(lead.email)) lead.email = undefined
  }

  if (await isDuplicate(lead.email ?? null, lead.phone ?? null)) return null

  const { data, error } = await leadsDb
    .from('freeme_leads')
    .insert({
      company_name:         lead.company_name,
      first_name:           lead.first_name           ?? null,
      last_name:            lead.last_name            ?? null,
      decision_maker_title: lead.decision_maker_title ?? null,
      email:                lead.email               ?? null,
      phone:                lead.phone               ?? null,
      website:              lead.website             ?? null,
      instagram_handle:     lead.instagram_handle    ?? null,
      followers_count:      lead.followers_count     ?? 0,
      industry:             lead.industry,
      location:             lead.location,
      source:               lead.source,
      has_website:          lead.has_website,
      recent_activity:      lead.recent_activity,
      is_diaspora:          lead.is_diaspora,
      notes:                lead.notes               ?? null,
    })
    .select('tier')
    .single()

  if (error) return null
  return (data as { tier: number }).tier
}

// ─── Master pipeline ─────────────────────────────────────────────────────────

export async function runPipeline(
  sources: Source[] = ['google_maps', 'instagram'],
): Promise<PipelineResult> {
  const runId = await startRun(sources)
  const log: object[] = []

  let totalFound     = 0
  let totalInserted  = 0
  let totalDupes     = 0
  let tier1 = 0, tier2 = 0, tier3 = 0
  const scraperResults: ScraperResult[] = []
  let pipelineError: string | undefined

  try {
    for (const source of sources) {
      const scraper = SCRAPERS[source]
      if (!scraper) continue

      log.push({ source, step: 'start', ts: new Date().toISOString() })

      const result = await scraper()
      scraperResults.push(result)
      totalFound += result.leads.length

      if (result.error) {
        log.push({ source, step: 'error', error: result.error })
      }

      // Insert each lead through validation + dedup
      for (const lead of result.leads) {
        const tier = await insertLead(lead)
        if (tier === null) {
          totalDupes++
        } else {
          totalInserted++
          if (tier === 1) tier1++
          else if (tier === 2) tier2++
          else tier3++
        }
      }

      log.push({ source, step: 'done', found: result.leads.length })
    }
  } catch (err) {
    pipelineError = String(err)
    log.push({ step: 'fatal', error: pipelineError })
  }

  const pipelineResult: Omit<PipelineResult, 'run_id'> = {
    total_found:      totalFound,
    total_inserted:   totalInserted,
    total_duplicates: totalDupes,
    tier1_found:      tier1,
    tier2_found:      tier2,
    tier3_found:      tier3,
    sources:          scraperResults,
    error:            pipelineError,
  }

  await finishRun(runId, pipelineResult, log)

  return { run_id: runId, ...pipelineResult }
}
