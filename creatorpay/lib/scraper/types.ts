import type { LeadIndustry, LeadLocation, LeadSource } from '@/types/leads'

export interface LeadInsert {
  company_name:         string
  first_name?:          string
  last_name?:           string
  decision_maker_title?: string
  email?:               string
  phone?:               string
  website?:             string
  instagram_handle?:    string
  followers_count?:     number
  industry:             LeadIndustry
  location:             LeadLocation
  source:               LeadSource
  has_website:          boolean
  recent_activity:      boolean
  is_diaspora:          boolean
  notes?:               string
}

export interface ScraperResult {
  source: LeadSource
  found:  number
  leads:  LeadInsert[]
  error?: string
}

export interface PipelineResult {
  run_id:          string
  total_found:     number
  total_inserted:  number
  total_duplicates:number
  tier1_found:     number
  tier2_found:     number
  tier3_found:     number
  sources:         ScraperResult[]
  error?:          string
}
