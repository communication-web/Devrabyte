import { NextResponse } from 'next/server'
import { leadsDb } from '@/lib/supabase/leads'

export async function GET() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [all, tier1, tier2, tier3, todayRes, contacted, meetings, won] = await Promise.all([
    leadsDb.from('freeme_leads').select('id', { count: 'exact', head: true }),
    leadsDb.from('freeme_leads').select('id', { count: 'exact', head: true }).eq('tier', 1),
    leadsDb.from('freeme_leads').select('id', { count: 'exact', head: true }).eq('tier', 2),
    leadsDb.from('freeme_leads').select('id', { count: 'exact', head: true }).eq('tier', 3),
    leadsDb.from('freeme_leads').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    leadsDb.from('freeme_leads').select('id', { count: 'exact', head: true }).eq('status', 'contacted'),
    leadsDb.from('freeme_leads').select('id', { count: 'exact', head: true }).eq('status', 'meeting_scheduled'),
    leadsDb.from('freeme_leads').select('id', { count: 'exact', head: true }).eq('status', 'closed_won'),
  ])

  return NextResponse.json({
    total:      all.count       ?? 0,
    tier1:      tier1.count     ?? 0,
    tier2:      tier2.count     ?? 0,
    tier3:      tier3.count     ?? 0,
    new_today:  todayRes.count  ?? 0,
    contacted:  contacted.count ?? 0,
    meetings:   meetings.count  ?? 0,
    won:        won.count       ?? 0,
  })
}
