import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ADVANCE_FEE_RATE } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { invoice_id } = await request.json()
  if (!invoice_id) return Response.json({ error: 'invoice_id is required' }, { status: 400 })

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoice_id)
    .eq('creator_id', user.id)
    .single()

  if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 })
  if (invoice.status !== 'sent') return Response.json({ error: 'Invoice must be in sent status' }, { status: 400 })
  if (invoice.advance_requested) return Response.json({ error: 'Advance already requested' }, { status: 400 })

  const fee_amount = invoice.total * ADVANCE_FEE_RATE
  const advance_amount = invoice.total - fee_amount

  await Promise.all([
    supabase.from('advances').insert({
      invoice_id,
      creator_id: user.id,
      advance_amount,
      fee_amount,
      status: 'requested',
    }),
    supabase.from('invoices').update({ advance_requested: true }).eq('id', invoice_id),
  ])

  return Response.json({
    success: true,
    advance_amount,
    fee_amount,
    message: "We'll review your request and contact you within 24 hours.",
  })
}
