import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paystack, getBankCode } from '@/lib/paystack'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { business_name, creative_category, phone, bank_name, bank_account_number, bank_account_name } = await request.json()

  if (!business_name || !creative_category || !phone || !bank_name || !bank_account_number || !bank_account_name) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: userData } = await supabase.from('cp_users').select('email, full_name').eq('id', user.id).single()
  const bank_code = getBankCode(bank_name)

  let paystack_subaccount_code: string | null = null
  let paystack_recipient_code: string | null = null

  try {
    const subaccount = await paystack.createSubaccount({
      business_name,
      settlement_bank: bank_code,
      account_number: bank_account_number,
      percentage_charge: 98.5,
      primary_contact_email: userData?.email,
      primary_contact_name: userData?.full_name,
      primary_contact_phone: phone,
    })
    paystack_subaccount_code = subaccount.subaccount_code
  } catch (err) {
    console.error('Subaccount creation failed:', err)
  }

  try {
    const recipient = await paystack.createTransferRecipient({
      type: 'nuban',
      name: bank_account_name,
      account_number: bank_account_number,
      bank_code,
    })
    paystack_recipient_code = recipient.recipient_code
  } catch (err) {
    console.error('Transfer recipient creation failed:', err)
  }

  const { error } = await supabase
    .from('cp_users')
    .update({
      business_name,
      creative_category,
      phone,
      bank_name,
      bank_account_number,
      bank_account_name,
      paystack_subaccount_code,
      paystack_recipient_code,
    })
    .eq('id', user.id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
