export type LeadIndustry =
  | 'music' | 'film' | 'photography' | 'podcast' | 'advertising'
  | 'events' | 'real_estate' | 'corporate' | 'diaspora' | 'other'

export type LeadLocation =
  | 'lekki' | 'victoria_island' | 'ikoyi' | 'yaba' | 'other_lagos' | 'international'

export type LeadSource =
  | 'instagram' | 'google_maps' | 'linkedin' | 'directory'
  | 'event_site' | 'cac_registry' | 'manual'

export type LeadStatus =
  | 'new' | 'contacted' | 'meeting_scheduled' | 'closed_won' | 'closed_lost' | 'opted_out'

export interface Lead {
  id: string
  created_at: string
  updated_at: string
  company_name: string
  first_name: string | null
  last_name: string | null
  decision_maker_title: string | null
  email: string | null
  phone: string | null
  email_valid: boolean | null
  industry: LeadIndustry
  location: LeadLocation
  source: LeadSource
  status: LeadStatus
  followers_count: number
  has_website: boolean
  recent_activity: boolean
  is_diaspora: boolean
  website: string | null
  instagram_handle: string | null
  score: number
  tier: 1 | 2 | 3
  notes: string | null
  last_contacted_at: string | null
  opted_out_at: string | null
}

export interface LeadStats {
  total: number
  tier1: number
  tier2: number
  tier3: number
  new_today: number
  contacted: number
  meetings: number
  won: number
}
