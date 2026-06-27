import { normalizePhone, guessIndustry, guessLocation } from './validate'
import type { LeadInsert, ScraperResult } from './types'

const API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? ''
const BASE    = 'https://maps.googleapis.com/maps/api/place'

// Lagos / Lekki Phase 1 centre point
const LOCATION = '6.4281,3.4800'
const RADIUS   = 15000 // metres

const SEARCH_QUERIES = [
  'recording studio Lagos',
  'music production studio Lekki',
  'film production company Lagos',
  'Nollywood production house',
  'photography studio Lekki',
  'advertising agency Lagos',
  'event management company Lagos',
  'podcast studio Lagos',
  'content creation studio Lagos',
  'branding agency Victoria Island',
  'media company Ikoyi',
  'creative agency Yaba Lagos',
]

interface PlaceResult {
  place_id:             string
  name:                 string
  formatted_address:    string
  formatted_phone_number?: string
  website?:             string
  types:                string[]
  rating?:              number
  user_ratings_total?:  number
  opening_hours?:       { open_now?: boolean }
}

async function textSearch(query: string): Promise<PlaceResult[]> {
  const url = new URL(`${BASE}/textsearch/json`)
  url.searchParams.set('query', query)
  url.searchParams.set('location', LOCATION)
  url.searchParams.set('radius', String(RADIUS))
  url.searchParams.set('key', API_KEY)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) return []
  const data = await res.json()
  return data.results ?? []
}

async function getPlaceDetails(placeId: string): Promise<Partial<PlaceResult>> {
  const url = new URL(`${BASE}/details/json`)
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('fields', 'name,formatted_address,formatted_phone_number,website,types,rating,user_ratings_total')
  url.searchParams.set('key', API_KEY)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) return {}
  const data = await res.json()
  return data.result ?? {}
}

function placeToLead(place: Partial<PlaceResult>): LeadInsert | null {
  if (!place.name) return null

  const address  = place.formatted_address ?? ''
  const industry = guessIndustry(`${place.name} ${place.types?.join(' ') ?? ''}`) as LeadInsert['industry']
  const location = guessLocation(address) as LeadInsert['location']
  const phone    = place.formatted_phone_number ? normalizePhone(place.formatted_phone_number) : null
  const hasWeb   = Boolean(place.website)
  const reviews  = place.user_ratings_total ?? 0

  return {
    company_name:    place.name,
    phone:           phone ?? undefined,
    website:         place.website,
    industry,
    location,
    source:          'google_maps',
    has_website:     hasWeb,
    recent_activity: reviews > 10,
    is_diaspora:     false,
    notes:           address ? `Google Maps: ${address}` : undefined,
  }
}

export async function scrapeGoogleMaps(): Promise<ScraperResult> {
  if (!API_KEY) {
    return { source: 'google_maps', found: 0, leads: [], error: 'GOOGLE_PLACES_API_KEY not set' }
  }

  const seen   = new Set<string>()
  const leads: LeadInsert[] = []

  try {
    for (const query of SEARCH_QUERIES) {
      // Respectful rate-limiting: 1 req/s
      await new Promise((r) => setTimeout(r, 1100))

      const results = await textSearch(query)

      for (const place of results.slice(0, 5)) {
        if (seen.has(place.place_id)) continue
        seen.add(place.place_id)

        await new Promise((r) => setTimeout(r, 600))
        const detail = await getPlaceDetails(place.place_id)
        const lead   = placeToLead({ ...place, ...detail })
        if (lead) leads.push(lead)
      }
    }

    return { source: 'google_maps', found: leads.length, leads }
  } catch (err) {
    return { source: 'google_maps', found: leads.length, leads, error: String(err) }
  }
}
