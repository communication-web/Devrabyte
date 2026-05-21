import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersTable } from '@/components/admin/users-table'

function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return adminEmails.includes(email.toLowerCase())
}

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email || !isAdminEmail(user.email)) redirect('/dashboard')

  // Fetch all users
  const { data: users } = await supabase
    .from('cp_users')
    .select('id, full_name, email, business_name, creative_category, bank_account_number, created_at')
    .order('created_at', { ascending: false })

  // Fetch invoice aggregates per creator
  const { data: invoiceStats } = await supabase
    .from('cp_invoices')
    .select('creator_id, total, status')

  // Aggregate
  const statsMap = new Map<string, { invoice_count: number; total_earned: number }>()
  for (const inv of invoiceStats ?? []) {
    const entry = statsMap.get(inv.creator_id) ?? { invoice_count: 0, total_earned: 0 }
    entry.invoice_count++
    if (inv.status === 'paid') entry.total_earned += inv.total ?? 0
    statsMap.set(inv.creator_id, entry)
  }

  const enriched = (users ?? []).map((u) => {
    const s = statsMap.get(u.id) ?? { invoice_count: 0, total_earned: 0 }
    return {
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      business_name: u.business_name,
      category: u.creative_category,
      has_bank: !!u.bank_account_number,
      created_at: u.created_at,
      invoice_count: s.invoice_count,
      total_earned: s.total_earned,
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.16em]">Admin</p>
        <h1 className="text-base font-semibold text-white mt-0.5 font-display">Users</h1>
      </div>

      <UsersTable users={enriched} />
    </div>
  )
}
