import { NextResponse } from 'next/server'
import { leadsDb } from '@/lib/supabase/leads'

export async function GET() {
  const { data, error } = await leadsDb
    .from('freeme_scrape_runs')
    .select('id, started_at, completed_at, status, sources_run, total_found, total_inserted, total_duplicates, tier1_found, tier2_found, tier3_found, error_message')
    .order('started_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ runs: data ?? [] })
}
