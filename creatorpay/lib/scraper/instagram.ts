import { guessIndustry } from './validate'
import type { LeadInsert, ScraperResult } from './types'

// Target hashtags from the whitepaper
const HASHTAGS = [
  'LagosStudio',
  'NaijaProducer',
  'LekkiPhotographer',
  'NaijaCreator',
  'LagosBrand',
  'LagosFilm',
  'NollywoodProducer',
  'LagosPhotographer',
  'LagosPodcast',
  'LagosAgency',
]

// Posts to inspect per hashtag
const POSTS_PER_TAG = 20

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'en-US,en;q=0.9',
  'x-ig-app-id':     '936619743392459',
  'Sec-Fetch-Site':  'same-origin',
}

interface IgEdgeNode {
  node: {
    owner?: {
      username?:       string
      full_name?:      string
      biography?:      string
      external_url?:   string
      edge_followed_by?: { count: number }
      is_business_account?: boolean
      category_name?: string
    }
    caption?:    { edges: { node: { text: string } }[] }
    taken_at_timestamp?: number
  }
}

async function fetchHashtagPosts(hashtag: string): Promise<IgEdgeNode[]> {
  const url = `https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag)}/?__a=1&__d=dis`

  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } })
  if (!res.ok) return []

  const text = await res.text()
  // Instagram sometimes returns HTML when not authenticated
  if (text.trim().startsWith('<')) return []

  const data = JSON.parse(text)
  const section = data?.graphql?.hashtag?.edge_hashtag_to_media?.edges
    ?? data?.data?.hashtag?.edge_hashtag_to_media?.edges
    ?? []

  return section.slice(0, POSTS_PER_TAG)
}

function edgeToLead(edge: IgEdgeNode): LeadInsert | null {
  const owner = edge.node?.owner
  if (!owner?.username) return null

  // Only include business-adjacent accounts
  const bio  = owner.biography ?? ''
  const name = owner.full_name  ?? owner.username
  const followers = owner.edge_followed_by?.count ?? 0

  // Skip personal accounts with very low following (< 200)
  if (followers < 200) return null

  const industry = guessIndustry(`${name} ${bio} ${owner.category_name ?? ''}`) as LeadInsert['industry']

  return {
    company_name:    name || owner.username,
    instagram_handle:`@${owner.username}`,
    website:         owner.external_url || undefined,
    followers_count: followers,
    industry,
    location:        'other_lagos',   // refine if bio has location keywords
    source:          'instagram',
    has_website:     Boolean(owner.external_url),
    recent_activity: true,            // appeared in recent hashtag feed
    is_diaspora:     false,
    notes:           bio ? `IG bio: ${bio.slice(0, 200)}` : undefined,
  }
}

export async function scrapeInstagram(): Promise<ScraperResult> {
  const seen  = new Set<string>()
  const leads: LeadInsert[] = []

  try {
    for (const tag of HASHTAGS) {
      await new Promise((r) => setTimeout(r, 3000 + Math.random() * 2000))

      const edges = await fetchHashtagPosts(tag)

      for (const edge of edges) {
        const username = edge.node?.owner?.username
        if (!username || seen.has(username)) continue
        seen.add(username)

        const lead = edgeToLead(edge)
        if (lead) leads.push(lead)
      }
    }

    return { source: 'instagram', found: leads.length, leads }
  } catch (err) {
    return { source: 'instagram', found: leads.length, leads, error: String(err) }
  }
}
