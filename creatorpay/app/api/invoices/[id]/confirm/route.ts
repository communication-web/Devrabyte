import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paystack } from '@/lib/paystack'
import { generateReference, toKobo } from '@/lib/utils'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // No auth required — this is called from the public invoice page by the client
  const { data: invoice, error: fetchError } = await supabase
    .from('cp_invoices')
    .select('*, cp_clients(email, name), cp_users(email, paystack_subaccount_code)')
    .eq('id', id)
    .single()

  if (fetchError || !invoice) {
    return Response.json({ error: 'Invoice not found' }, { status: 404 })
  }

  if (!invoice.escrow_enabled) {
    return Response.json({ error: 'This invoice does not use Protected Payment' }, { status: 400 })
  }

  if (invoice.escrow_status !== 'delivered') {
    return Response.json(
      { error: `Cannot confirm delivery. Current status: ${invoice.escrow_status}` },
      { status: 400 }
    )
  }

  const advancePct: number = invoice.advance_percentage ?? 70
  const balancePct = 100 - advancePct
  const balanceAmount = Math.round((invoice.total ?? 0) * balancePct / 100)

  const clientEmail =
    (invoice.cp_clients as { email?: string } | null)?.email ||
    (invoice.cp_users as { email?: string } | null)?.email ||
    ''

  // Create balance payment link via Paystack
  let balancePaymentLink: string | null = null
  try {
    const balanceRef = generateReference()
    const currency: string = invoice.currency || 'NGN'

    const payInit = await paystack.initializeTransaction({
      email: clientEmail,
      amount: toKobo(balanceAmount),
      ...(currency !== 'NGN' ? { currency } : {}),
      reference: balanceRef,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/callback`,
      metadata: {
        invoice_number: invoice.invoice_number,
        creator_id: invoice.creator_id,
        payment_type: 'balance',
      },
    })

    balancePaymentLink = payInit.authorization_url

    await supabase
      .from('cp_invoices')
      .update({
        confirmed_at: new Date().toISOString(),
        escrow_status: 'confirmed',
        balance_payment_reference: balanceRef,
        balance_payment_link: balancePaymentLink,
      })
      .eq('id', id)
  } catch (err) {
    console.error('Paystack balance init failed:', err)
    // Still confirm delivery even if payment link creation fails
    await supabase
      .from('cp_invoices')
      .update({
        confirmed_at: new Date().toISOString(),
        escrow_status: 'confirmed',
      })
      .eq('id', id)
  }

  return Response.json({
    success: true,
    balance_payment_link: balancePaymentLink,
    balance_amount: balanceAmount,
    message: 'Delivery confirmed. Please proceed to pay the remaining balance.',
  })
}
