import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Public endpoint — no auth required
// Returns minimal invoice data needed for public-facing confirm/dispute pages
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ invoice_number: string }> }
) {
  const { invoice_number } = await params
  const supabase = await createClient()

  const { data: invoice, error } = await supabase
    .from('cp_invoices')
    .select(
      'id, invoice_number, total, advance_percentage, escrow_enabled, escrow_status, delivered_at, confirmed_at, cp_users(business_name, full_name), cp_clients(name, email)'
    )
    .eq('invoice_number', invoice_number)
    .single()

  if (error || !invoice) {
    return Response.json({ error: 'Invoice not found' }, { status: 404 })
  }

  return Response.json({ invoice })
}
