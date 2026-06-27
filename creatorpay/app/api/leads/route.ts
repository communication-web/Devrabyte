import { NextRequest, NextResponse } from 'next/server'
import { leadsDb } from '@/lib/supabase/leads'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status  = searchParams.get('status')
  const tier    = searchParams.get('tier')
  const source  = searchParams.get('source')
  const search  = searchParams.get('search')
  const page    = parseInt(searchParams.get('page') ?? '1', 10)
  const limit   = parseInt(searchParams.get('limit') ?? '50', 10)
  const offset  = (page - 1) * limit

  let query = leadsDb
    .from('freeme_leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status)  query = query.eq('status', status)
  if (tier)    query = query.eq('tier', parseInt(tier, 10))
  if (source)  query = query.eq('source', source)
  if (search) {
    query = query.or(
      `company_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
    )
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ leads: data, total: count ?? 0, page, limit })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const {
    company_name, first_name, last_name, decision_maker_title,
    email, phone, industry, location, source, status,
    followers_count, has_website, recent_activity, is_diaspora,
    website, instagram_handle, notes,
  } = body

  if (!company_name) {
    return NextResponse.json({ error: 'company_name is required' }, { status: 400 })
  }

  const { data, error } = await leadsDb
    .from('freeme_leads')
    .insert({
      company_name,
      first_name:          first_name          || null,
      last_name:           last_name           || null,
      decision_maker_title:decision_maker_title|| null,
      email:               email               || null,
      phone:               phone               || null,
      industry:            industry            || 'other',
      location:            location            || 'other_lagos',
      source:              source              || 'manual',
      status:              status              || 'new',
      followers_count:     followers_count     ?? 0,
      has_website:         has_website         ?? false,
      recent_activity:     recent_activity     ?? false,
      is_diaspora:         is_diaspora         ?? false,
      website:             website             || null,
      instagram_handle:    instagram_handle    || null,
      notes:               notes               || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lead: data }, { status: 201 })
}
