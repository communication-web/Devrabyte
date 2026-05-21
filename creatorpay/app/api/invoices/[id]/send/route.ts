import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paystack } from '@/lib/paystack'
import { generateReference, toKobo, formatDate } from '@/lib/utils'
import { sendInvoiceEmail } from '@/lib/email'
import { LineItem } from '@/types'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: invoice } = await supabase
    .from('cp_invoices')
    .select('*, cp_clients(email, name)')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 })
  if (invoice.status !== 'draft') return Response.json({ error: 'Invoice is not a draft' }, { status: 400 })

  const { data: userData } = await supabase
    .from('cp_users')
    .select('email, full_name, business_name, invoice_default_notes')
    .eq('id', user.id)
    .single()

  const clientEmail = (invoice.cp_clients as { email: string; name: string } | null)?.email || userData?.email || ''
  const isEscrow = !!invoice.escrow_enabled
  const advancePct = invoice.advance_percentage || 70
  const reference = invoice.payment_reference || generateReference()
  let paystack_payment_link = invoice.paystack_payment_link
  const updates: Record<string, unknown> = { status: 'sent', payment_reference: reference }

  // Platform-holds model: no subaccount split
  try {
    if (isEscrow) {
      const advanceAmount = Math.round(invoice.total * advancePct / 100)
      const advanceRef = invoice.advance_payment_reference || generateReference()
      const payInit = await paystack.initializeTransaction({
        email: clientEmail,
        amount: toKobo(advanceAmount),
        reference: advanceRef,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/callback`,
        metadata: { invoice_number: invoice.invoice_number, creator_id: user.id, payment_type: 'advance' },
      })
      updates.advance_payment_reference = advanceRef
      updates.advance_payment_link = payInit.authorization_url
      updates.paystack_payment_link = payInit.authorization_url
      updates.escrow_status = 'awaiting_advance'
      paystack_payment_link = payInit.authorization_url
    } else {
      const payInit = await paystack.initializeTransaction({
        email: clientEmail,
        amount: toKobo(invoice.total),
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/callback`,
        metadata: { invoice_number: invoice.invoice_number, creator_id: user.id, payment_type: 'full' },
      })
      updates.paystack_payment_link = payInit.authorization_url
      paystack_payment_link = payInit.authorization_url
    }
  } catch (err) {
    console.error('Paystack init failed:', err)
  }

  const { error } = await supabase.from('cp_invoices').update(updates).eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  if (paystack_payment_link && clientEmail) {
    const client = invoice.cp_clients as { email: string; name: string } | null
    sendInvoiceEmail({
      to: clientEmail,
      clientName: client?.name || 'Client',
      creatorName: userData?.business_name || userData?.full_name || 'Your service provider',
      invoiceNumber: invoice.invoice_number,
      total: isEscrow ? Math.round(invoice.total * advancePct / 100) : invoice.total,
      dueDate: formatDate(invoice.due_date),
      paymentLink: paystack_payment_link,
      lineItems: invoice.line_items as LineItem[],
      currency: invoice.currency || 'NGN',
      notes: isEscrow
        ? `Protected Payment: ${advancePct}% advance due now. Remaining ${100 - advancePct}% due after you confirm delivery.`
        : (userData?.invoice_default_notes || undefined),
    }).catch((err) => console.error('Invoice email failed:', err))
  }

  return Response.json({ success: true, paystack_payment_link })
}
