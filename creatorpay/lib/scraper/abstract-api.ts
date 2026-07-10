/**
 * Abstract API — company enrichment + web scraping
 * Docs: https://www.abstractapi.com/api/company-enrichment
 *
 * Required env vars:
 *   ABSTRACT_API_COMPANY_ENRICHMENT_API_KEY
 *   ABSTRACT_API_COMPANY_ENRICHMENT_API_URL  (default below)
 *   ABSTRACT_API_SCRAPE_API_KEY
 *   ABSTRACT_API_SCRAPE_URL                  (default below)
 */

const ENRICH_URL = process.env.ABSTRACT_API_COMPANY_ENRICHMENT_API_URL
  ?? 'https://companyenrichment.abstractapi.com/v1/'
const ENRICH_KEY = process.env.ABSTRACT_API_COMPANY_ENRICHMENT_API_KEY ?? ''

const SCRAPE_URL = process.env.ABSTRACT_API_SCRAPE_URL
  ?? 'https://scrape.abstractapi.com/v1/'
const SCRAPE_KEY = process.env.ABSTRACT_API_SCRAPE_API_KEY ?? ''

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AbstractCompany {
  name:            string
  domain:          string
  year_founded?:   number
  industry?:       string
  employees_count?: number
  locality?:       string
  country?:        string
  linkedin_url?:   string
  twitter_url?:    string
  phone?:          string
  email?:          string
  description?:    string
  logo?:           string
}

// ─── Company enrichment ───────────────────────────────────────────────────────

export async function enrichCompany(domain: string): Promise<AbstractCompany | null> {
  if (!ENRICH_KEY) return null

  const url = new URL(ENRICH_URL)
  url.searchParams.set('api_key', ENRICH_KEY)
  url.searchParams.set('domain', domain)

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 0 } })
    if (!res.ok) return null
    const data = await res.json()
    return data as AbstractCompany
  } catch {
    return null
  }
}

// ─── Scrape a URL ─────────────────────────────────────────────────────────────

export async function scrapeUrl(targetUrl: string): Promise<string | null> {
  if (!SCRAPE_KEY) return null

  const url = new URL(SCRAPE_URL)
  url.searchParams.set('api_key', SCRAPE_KEY)
  url.searchParams.set('url', targetUrl)
  url.searchParams.set('render_js', 'false')

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 0 } })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}
