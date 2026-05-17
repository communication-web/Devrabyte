import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const [txRes, pendingRes, withdrawalsRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('creator_amount')
      .eq('creator_id', user.id)
      .eq('status', 'success'),
    supabase
      .from('invoices')
      .select('total')
      .eq('creator_id', user.id)
      .eq('status', 'sent'),
    supabase
      .from('withdrawals')
      .select('amount')
      .eq('creator_id', user.id)
      .eq('status', 'success'),
  ])

  const total_earned = (txRes.data || []).reduce((sum, tx) => sum + (tx.creator_amount || 0), 0)
  const paid_out = (withdrawalsRes.data || []).reduce((sum, w) => sum + (w.amount || 0), 0)
  const available_balance = total_earned - paid_out
  const pending_amount = (pendingRes.data || []).reduce((sum, inv) => sum + (inv.total || 0), 0)

  return Response.json({
    total_earned,
    available_balance: Math.max(0, available_balance),
    pending_amount,
    paid_out,
  })
}
