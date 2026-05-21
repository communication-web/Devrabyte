import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_REASONS = [
  'Work not delivered',
  'Quality issues',
  'Wrong deliverables',
  'Partial delivery',
  'Other',
]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const body = await request.json()
  const { reason, details, client_email, client_name, raised_by = 'client' } = body

  if (!reason || !client_email || !client_name) {
    return Response.json({ error: 'Missing required fields: reason, client_email, client_name' }, { status: 400 })
  }

  if (!VALID_REASONS.includes(reason)) {
    return Response.json({ error: 'Invalid reason' }, { status: 400 })
  }

  if (!['client', 'creator'].includes(raised_by)) {
    return Response.json({ error: 'raised_by must be client or creator' }, { status: 400 })
  }

  // Fetch invoice
  const { data: invoice, error: fetchError } = await supabase
    .from('cp_invoices')
    .select('id, creator_id, escrow_enabled, escrow_status')
    .eq('id', id)
    .single()

  if (fetchError || !invoice) {
    return Response.json({ error: 'Invoice not found' }, { status: 404 })
  }

  // Insert dispute
  const { error: disputeError } = await supabase.from('cp_disputes').insert({
    invoice_id: id,
    creator_id: invoice.creator_id,
    client_email,
    client_name,
    raised_by,
    reason,
    details: details || null,
    status: 'open',
  })

  if (disputeError) {
    return Response.json({ error: disputeError.message }, { status: 500 })
  }

  // Update invoice escrow status
  const { error: updateError } = await supabase
    .from('cp_invoices')
    .update({ escrow_status: 'disputed' })
    .eq('id', id)

  if (updateError) {
    console.error('Failed to update invoice escrow_status to disputed:', updateError.message)
  }

  return Response.json({
    success: true,
    message: 'Dispute raised successfully. Our team will review within 5 business days.',
  })
}
