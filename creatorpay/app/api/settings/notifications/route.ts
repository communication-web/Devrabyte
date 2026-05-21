import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    notify_invoice_paid?: boolean
    notify_invoice_overdue?: boolean
    notify_advance_approved?: boolean
    notify_withdrawal_complete?: boolean
    notify_email?: boolean
    notify_sms?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: Record<string, boolean | undefined> = {}
  if (body.notify_invoice_paid !== undefined) updates.notify_invoice_paid = body.notify_invoice_paid
  if (body.notify_invoice_overdue !== undefined) updates.notify_invoice_overdue = body.notify_invoice_overdue
  if (body.notify_advance_approved !== undefined) updates.notify_advance_approved = body.notify_advance_approved
  if (body.notify_withdrawal_complete !== undefined) updates.notify_withdrawal_complete = body.notify_withdrawal_complete
  if (body.notify_email !== undefined) updates.notify_email = body.notify_email
  if (body.notify_sms !== undefined) updates.notify_sms = body.notify_sms

  const { error } = await supabase
    .from('cp_users')
    .update(updates)
    .eq('id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}
