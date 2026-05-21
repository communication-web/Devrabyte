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
    const amount = data.amount / 100
    const channel = data.channel
    const paymentType = data.metadata?.payment_type || 'full'

    // Find invoice by payment reference (full, advance, or balance)
    let invoice = null
    const { data: byMain } = await supabase
      .from('cp_invoices')
      .select('*, cp_users(phone, business_name, full_name)')
      .eq('payment_reference', reference)
      .single()
    if (byMain) invoice = byMain

    if (!invoice) {
      const { data: byAdvance } = await supabase
        .from('cp_invoices')
        .select('*, cp_users(phone, business_name, full_name)')
        .eq('advance_payment_reference', reference)
        .single()
      if (byAdvance) invoice = byAdvance
    }

    if (!invoice) {
      const { data: byBalance } = await supabase
        .from('cp_invoices')
        .select('*, cp_users(phone, business_name, full_name)')
        .eq('balance_payment_reference', reference)
        .single()
      if (byBalance) invoice = byBalance
    }

    if (!invoice) return Response.json({ received: true })

    const platform_fee_amount = amount * PLATFORM_FEE_RATE
    const creator_amount = amount - platform_fee_amount
    const isEscrow = !!invoice.escrow_enabled
    const advancePct = invoice.advance_percentage || 70

    if (isEscrow) {
      if (paymentType === 'advance' || (invoice.escrow_status === 'awaiting_advance' && invoice.advance_paid_amount === 0)) {
        // Advance payment received
        await supabase.from('cp_invoices').update({
          advance_paid_amount: amount,
          escrow_status: 'advance_paid',
          status: 'sent', // stays sent until full payment
        }).eq('id', invoice.id)

        await supabase.from('cp_transactions').insert({
          invoice_id: invoice.id,
          creator_id: invoice.creator_id,
          amount,
          platform_fee_amount,
          creator_amount,
          paystack_reference: reference,
          paystack_channel: channel,
          status: 'success',
          paid_at: new Date().toISOString(),
          payment_type: 'advance',
        })

        const creatorUser = invoice.cp_users as { phone: string | null; business_name: string | null; full_name: string } | null
        if (creatorUser?.phone) {
          const name = creatorUser.business_name || creatorUser.full_name
          await sendWhatsApp(creatorUser.phone, `${advancePct}% advance of ${formatCurrency(amount)} received for invoice ${invoice.invoice_number}. Mark as delivered when work is done.`)
        }

      } else if (paymentType === 'balance' || invoice.escrow_status === 'confirmed') {
        // Balance payment received
        const totalPaid = (invoice.advance_paid_amount || 0) + amount
        await supabase.from('cp_invoices').update({
          balance_paid_amount: amount,
          escrow_status: 'completed',
          status: 'paid',
        }).eq('id', invoice.id)

        await supabase.from('cp_transactions').insert({
          invoice_id: invoice.id,
          creator_id: invoice.creator_id,
          amount,
          platform_fee_amount,
          creator_amount,
          paystack_reference: reference,
          paystack_channel: channel,
          status: 'success',
          paid_at: new Date().toISOString(),
          payment_type: 'balance',
        })

        const creatorUser = invoice.cp_users as { phone: string | null; business_name: string | null; full_name: string } | null
        if (creatorUser?.phone) {
          await sendWhatsApp(creatorUser.phone, `Balance payment received for invoice ${invoice.invoice_number}. Total paid: ${formatCurrency(totalPaid)}. Funds available for withdrawal.`)
        }
      }
    } else {
      // Standard full payment
      if (invoice.status === 'paid') return Response.json({ received: true })

      await supabase.from('cp_invoices').update({ status: 'paid' }).eq('id', invoice.id)

      await supabase.from('cp_transactions').insert({
        invoice_id: invoice.id,
        creator_id: invoice.creator_id,
        amount,
        platform_fee_amount,
        creator_amount,
        paystack_reference: reference,
        paystack_channel: channel,
        status: 'success',
        paid_at: new Date().toISOString(),
        payment_type: 'full',
      })

      const creatorUser = invoice.cp_users as { phone: string | null; business_name: string | null; full_name: string } | null
      if (creatorUser?.phone) {
        await sendWhatsApp(creatorUser.phone, `Invoice ${invoice.invoice_number} has been paid in full. ${formatCurrency(creator_amount)} is now in your CreatorPay wallet.`)
      }
    }
  }

  if (event.event === 'transfer.success') {
    await supabase.from('cp_withdrawals').update({ status: 'success' }).eq('paystack_transfer_code', event.data.transfer_code)
  }

  if (event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
    const status = event.event === 'transfer.failed' ? 'failed' : 'reversed'
    await supabase.from('cp_withdrawals').update({ status }).eq('paystack_transfer_code', event.data.transfer_code)
  }

  return Response.json({ received: true })
}
