import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify invoice belongs to this creator and is in the correct state
  const { data: invoice, error: fetchError } = await supabase
    .from('cp_invoices')
    .select('id, creator_id, escrow_enabled, escrow_status')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (fetchError || !invoice) {
    return Response.json({ error: 'Invoice not found' }, { status: 404 })
  }

  if (!invoice.escrow_enabled) {
    return Response.json({ error: 'This invoice does not have Protected Payment enabled' }, { status: 400 })
  }

  if (invoice.escrow_status !== 'advance_paid') {
    return Response.json(
      { error: `Cannot mark as delivered. Current status: ${invoice.escrow_status}. Advance payment must be received first.` },
      { status: 400 }
    )
  }

  const { error: updateError } = await supabase
    .from('cp_invoices')
    .update({
      delivered_at: new Date().toISOString(),
      escrow_status: 'delivered',
    })
    .eq('id', id)
    .eq('creator_id', user.id)

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 })
  }

  return Response.json({ success: true, message: 'Invoice marked as delivered. Your client has been notified to confirm delivery.' })
}
