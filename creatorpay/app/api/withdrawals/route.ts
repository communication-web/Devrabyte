import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paystack } from '@/lib/paystack'
import { generateReference, toKobo } from '@/lib/utils'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  return Response.json({ withdrawals: withdrawals || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount } = await request.json()

  if (!amount || amount <= 0) {
    return Response.json({ error: 'Invalid amount' }, { status: 400 })
  }

  // Calculate available balance
  const [txRes, withdrawalsRes] = await Promise.all([
    supabase.from('transactions').select('creator_amount').eq('creator_id', user.id).eq('status', 'success'),
    supabase.from('withdrawals').select('amount').eq('creator_id', user.id).eq('status', 'success'),
  ])

  const total_earned = (txRes.data || []).reduce((sum, tx) => sum + tx.creator_amount, 0)
  const paid_out = (withdrawalsRes.data || []).reduce((sum, w) => sum + w.amount, 0)
  const available_balance = total_earned - paid_out

  if (amount > available_balance) {
    return Response.json({ error: 'Insufficient balance' }, { status: 400 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('paystack_recipient_code')
    .eq('id', user.id)
    .single()

  if (!userData?.paystack_recipient_code) {
    return Response.json({ error: 'Bank account not set up. Please complete onboarding.' }, { status: 400 })
  }

  const reference = generateReference('WIT')
  let transfer_code: string | null = null

  try {
    const transfer = await paystack.initiateTransfer({
      source: 'balance',
      amount: toKobo(amount),
      recipient: userData.paystack_recipient_code,
      reason: 'CreatorPay withdrawal',
      reference,
    })
    transfer_code = transfer.transfer_code
  } catch (err) {
    console.error('Transfer failed:', err)
    return Response.json({ error: 'Transfer initiation failed. Please try again.' }, { status: 500 })
  }

  const { data: withdrawal, error } = await supabase
    .from('withdrawals')
    .insert({
      creator_id: user.id,
      amount,
      paystack_transfer_code: transfer_code,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ withdrawal }, { status: 201 })
}
