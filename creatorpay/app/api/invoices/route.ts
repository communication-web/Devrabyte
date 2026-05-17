import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paystack } from '@/lib/paystack'
import { calculateFees, generateReference, toKobo } from '@/lib/utils'
import { LineItem } from '@/types'

async function getNextInvoiceNumber(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string> {
  const { count } = await supabase
    .from('invoices')
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
    .from('invoices')
    .select('*, clients(name, company)')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ invoices })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { client_id, new_client, due_date, line_items, action } = await request.json()

  if (!due_date || !line_items?.length) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Create new client inline if needed
  let resolvedClientId = client_id
  if (new_client) {
    const { data: createdClient, error: clientError } = await supabase
      .from('clients')
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

  const invoiceData: Record<string, unknown> = {
    creator_id: user.id,
    client_id: resolvedClientId || null,
    invoice_number,
    line_items: items,
    subtotal,
    platform_fee,
    total,
    due_date,
    status: action === 'send' ? 'sent' : 'draft',
    payment_reference: reference,
  }

  // If sending, create Paystack payment link
  if (action === 'send' && resolvedClientId) {
    const { data: userData } = await supabase
      .from('users')
      .select('paystack_subaccount_code, email')
      .eq('id', user.id)
      .single()

    const { data: clientData } = await supabase
      .from('clients')
      .select('email')
      .eq('id', resolvedClientId)
      .single()

    if (userData?.paystack_subaccount_code) {
      try {
        const payInit = await paystack.initializeTransaction({
          email: clientData?.email || userData.email,
          amount: toKobo(total),
          reference,
          subaccount: userData.paystack_subaccount_code,
          bearer: 'subaccount',
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/callback`,
          metadata: { invoice_number, creator_id: user.id },
        })
        invoiceData.paystack_payment_link = payInit.authorization_url
      } catch (err) {
        console.error('Paystack init failed:', err)
      }
    }
  }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ invoice }, { status: 201 })
}
