import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paystack } from '@/lib/paystack'
import { generateReference, toKobo } from '@/lib/utils'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: invoice } = await supabase
    .from('cp_invoices')
    .select('*, cp_clients(email)')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 })
  if (invoice.status !== 'draft') return Response.json({ error: 'Invoice is not a draft' }, { status: 400 })

  const { data: userData } = await supabase
    .from('cp_users')
    .select('paystack_subaccount_code, email')
    .eq('id', user.id)
    .single()

  const reference = invoice.payment_reference || generateReference()
  let paystack_payment_link = invoice.paystack_payment_link

  if (userData?.paystack_subaccount_code) {
    try {
      const payInit = await paystack.initializeTransaction({
        email: (invoice.clients as { email: string } | null)?.email || userData.email,
        amount: toKobo(invoice.total),
        reference,
        subaccount: userData.paystack_subaccount_code,
        bearer: 'subaccount',
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/callback`,
        metadata: { invoice_number: invoice.invoice_number, creator_id: user.id },
      })
      paystack_payment_link = payInit.authorization_url
    } catch (err) {
      console.error('Paystack init failed:', err)
    }
  }

  const { error } = await supabase
    .from('cp_invoices')
    .update({ status: 'sent', payment_reference: reference, paystack_payment_link })
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true, paystack_payment_link })
}
