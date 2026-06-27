import { NextRequest, NextResponse } from 'next/server'
import { leadsDb } from '@/lib/supabase/leads'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await leadsDb
    .from('freeme_leads')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ lead: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  // If marking as opted_out, stamp the time
  if (body.status === 'opted_out' && !body.opted_out_at) {
    body.opted_out_at = new Date().toISOString()
  }
  // If marking as contacted, stamp last_contacted_at
  if (body.status === 'contacted' && !body.last_contacted_at) {
    body.last_contacted_at = new Date().toISOString()
  }

  const { data, error } = await leadsDb
    .from('freeme_leads')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lead: data })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await leadsDb
    .from('freeme_leads')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
