import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsApp } from '@/lib/termii'
import { formatCurrency, PLATFORM_FEE_RATE } from '@/lib/utils'
import crypto from 'crypto'

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY!
  const hash = crypto.createHmac('sha512', secret).update(body).digest('hex')
  return hash === signature
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-paystack-signature') || ''

  if (!verifySignature(body, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  const supabase = await createClient()

  if (event.event === 'charge.success') {
    const data = event.data
    const reference = data.reference
    const amount = data.amount / 100 // from kobo to naira
    const channel = data.channel

    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, users(phone, business_name)')
      .eq('payment_reference', reference)
      .single()

    if (!invoice || invoice.status === 'paid') {
      return Response.json({ received: true })
    }

    const platform_fee_amount = amount * PLATFORM_FEE_RATE
    const creator_amount = amount - platform_fee_amount

    await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', invoice.id)

    await supabase.from('transactions').insert({
      invoice_id: invoice.id,
      creator_id: invoice.creator_id,
      amount,
      platform_fee_amount,
      creator_amount,
      paystack_reference: reference,
      paystack_channel: channel,
      status: 'success',
      paid_at: new Date().toISOString(),
    })

    const creatorUser = invoice.users as { phone: string | null; business_name: string | null } | null
    if (creatorUser?.phone) {
      const msg = `Your invoice ${invoice.invoice_number} has been paid. ${formatCurrency(creator_amount)} is now in your CreatorPay wallet.`
      await sendWhatsApp(creatorUser.phone, msg)
    }
  }

  if (event.event === 'transfer.success') {
    const transferCode = event.data.transfer_code
    await supabase
      .from('withdrawals')
      .update({ status: 'success' })
      .eq('paystack_transfer_code', transferCode)
  }

  if (event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
    const transferCode = event.data.transfer_code
    const status = event.event === 'transfer.failed' ? 'failed' : 'reversed'
    await supabase
      .from('withdrawals')
      .update({ status })
      .eq('paystack_transfer_code', transferCode)
  }

  return Response.json({ received: true })
}
