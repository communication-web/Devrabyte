import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paystack } from '@/lib/paystack'
import { calculateFees, generateReference, toKobo, formatDate } from '@/lib/utils'
import { LineItem } from '@/types'
import { sendInvoiceEmail } from '@/lib/email'

async function getNextInvoiceNumber(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string> {
  const { count } = await supabase
    .from('cp_invoices')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', userId)

  const num = ((count || 0) + 1).toString().padStart(4, '0')
  return `INV-${num}`
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: invoices, error } = await supabase
    .from('cp_invoices')
    .select('*, cp_clients(name, company)')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ invoices })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { client_id, new_client, due_date, line_items, currency, action, escrow_enabled, advance_percentage } = await request.json()

  if (!due_date || !line_items?.length) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Create new client inline if needed
  let resolvedClientId = client_id
  if (new_client) {
    const { data: createdClient, error: clientError } = await supabase
      .from('cp_clients')
      .insert({ creator_id: user.id, ...new_client })
      .select()
      .single()
    if (clientError) return Response.json({ error: clientError.message }, { status: 500 })
    resolvedClientId = createdClient.id
  }

  const items = line_items as LineItem[]
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const { platform_fee, total } = calculateFees(subtotal)
  const invoice_number = await getNextInvoiceNumber(supabase, user.id)
  const reference = generateReference()

  const isEscrow = !!escrow_enabled
  const advancePct = isEscrow ? (advance_percentage || 70) : 100

  const invoiceData: Record<string, unknown> = {
    creator_id: user.id,
    client_id: resolvedClientId || null,
    invoice_number,
    line_items: items,
    subtotal,
    platform_fee,
    total,
    due_date,
    currency: currency || 'NGN',
    status: action === 'send' ? 'sent' : 'draft',
    payment_reference: reference,
    escrow_enabled: isEscrow,
    advance_percentage: advancePct,
    escrow_status: isEscrow ? 'awaiting_advance' : 'none',
  }

  // If sending, create Paystack payment link
  // Platform-holds model: NO subaccount split — platform receives all funds
  // and transfers to creators manually on withdrawal request.
  if (action === 'send' && resolvedClientId) {
    const { data: userData } = await supabase
      .from('cp_users')
      .select('email')
      .eq('id', user.id)
      .single()

    const { data: clientData } = await supabase
      .from('cp_clients')
      .select('email')
      .eq('id', resolvedClientId)
      .single()

    const clientEmail = clientData?.email || userData?.email || ''

    try {
      if (isEscrow) {
        // Advance payment link (X% of total)
        const advanceAmount = Math.round(total * advancePct / 100)
        const advanceRef = generateReference()
        const payInit = await paystack.initializeTransaction({
          email: clientEmail,
          amount: toKobo(advanceAmount),
          ...(currency && currency !== 'NGN' ? { currency } : {}),
          reference: advanceRef,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/callback`,
          metadata: { invoice_number, creator_id: user.id, payment_type: 'advance' },
        })
        invoiceData.advance_payment_reference = advanceRef
        invoiceData.advance_payment_link = payInit.authorization_url
        invoiceData.paystack_payment_link = payInit.authorization_url
      } else {
        const payInit = await paystack.initializeTransaction({
          email: clientEmail,
          amount: toKobo(total),
          ...(currency && currency !== 'NGN' ? { currency } : {}),
          reference,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/callback`,
          metadata: { invoice_number, creator_id: user.id, payment_type: 'full' },
        })
        invoiceData.paystack_payment_link = payInit.authorization_url
      }
    } catch (err) {
      console.error('Paystack init failed:', err)
    }
  }

  const { data: invoice, error } = await supabase
    .from('cp_invoices')
    .insert(invoiceData)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Send invoice email to client
  const paymentLink = invoiceData.paystack_payment_link as string | undefined
  if (action === 'send' && resolvedClientId && paymentLink) {
    const { data: clientData } = await supabase.from('cp_clients').select('email, name').eq('id', resolvedClientId).single()
    const { data: userData } = await supabase.from('cp_users').select('full_name, business_name, invoice_default_notes').eq('id', user.id).single()

    if (clientData?.email) {
      sendInvoiceEmail({
        to: clientData.email,
        clientName: clientData.name,
        creatorName: userData?.business_name || userData?.full_name || 'Your service provider',
        invoiceNumber: invoice_number,
        total: isEscrow ? Math.round(total * advancePct / 100) : total,
        dueDate: formatDate(due_date),
        paymentLink,
        lineItems: items,
        currency: currency || 'NGN',
        notes: isEscrow
          ? `This is a Protected Payment invoice. You are paying ${advancePct}% advance (${currency === 'USD' ? '$' : '₦'}${Math.round(total * advancePct / 100).toLocaleString()}). The remaining ${100 - advancePct}% is due after you confirm delivery.${userData?.invoice_default_notes ? '\n\n' + userData.invoice_default_notes : ''}`
          : (userData?.invoice_default_notes || undefined),
      }).catch((err) => console.error('Invoice email failed:', err))
    }
  }

  return Response.json({ invoice }, { status: 201 })
}
