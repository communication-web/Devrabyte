import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Users, FileText, TrendingUp, ArrowDownToLine, Clock } from 'lucide-react'

function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return adminEmails.includes(email.toLowerCase())
}

interface MetricCardProps {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  accent?: string
}

function MetricCard({ label, value, sub, icon, accent = 'text-violet-400' }: MetricCardProps) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-white/[0.07] p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.14em]">{label}</p>
        <div className={`${accent} opacity-70`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white font-display tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  )
}

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email || !isAdminEmail(user.email)) redirect('/dashboard')

  const [
    usersRes,
    invoicedRes,
    platformRevRes,
    withdrawnRes,
    pendingWithdrawalsRes,
    recentSignupsRes,
  ] = await Promise.all([
    supabase.from('cp_users').select('*', { count: 'exact', head: true }),
    supabase.from('cp_invoices').select('total').eq('status', 'paid'),
    supabase.from('cp_transactions').select('platform_fee_amount').eq('status', 'success'),
    supabase.from('cp_withdrawals').select('amount').eq('status', 'success'),
    supabase.from('cp_withdrawals').select('amount').eq('status', 'pending'),
    supabase
      .from('cp_users')
      .select('id, full_name, email, business_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const totalUsers = usersRes.count ?? 0
  const totalInvoiced = (invoicedRes.data ?? []).reduce((s, r) => s + (r.total ?? 0), 0)
  const platformRevenue = (platformRevRes.data ?? []).reduce((s, r) => s + (r.platform_fee_amount ?? 0), 0)
  const totalWithdrawn = (withdrawnRes.data ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const pendingWithdrawalsData = pendingWithdrawalsRes.data ?? []
  const pendingCount = pendingWithdrawalsData.length
  const pendingAmount = pendingWithdrawalsData.reduce((s, r) => s + (r.amount ?? 0), 0)

  const recentSignups = recentSignupsRes.data ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.16em]">Admin</p>
        <h1 className="text-base font-semibold text-white mt-0.5 font-display">
          Platform Overview
        </h1>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricCard
          label="Total Users"
          value={totalUsers.toLocaleString()}
          icon={<Users className="h-4 w-4" />}
          accent="text-violet-400"
        />
        <MetricCard
          label="Total Invoiced"
          value={formatCurrency(totalInvoiced)}
          sub="Paid invoices only"
          icon={<FileText className="h-4 w-4" />}
          accent="text-emerald-400"
        />
        <MetricCard
          label="Platform Revenue"
          value={formatCurrency(platformRevenue)}
          sub="1.5% fee on transactions"
          icon={<TrendingUp className="h-4 w-4" />}
          accent="text-amber-400"
        />
        <MetricCard
          label="Total Withdrawn"
          value={formatCurrency(totalWithdrawn)}
          sub="Successful payouts"
          icon={<ArrowDownToLine className="h-4 w-4" />}
          accent="text-sky-400"
        />
        <MetricCard
          label="Pending Withdrawals"
          value={formatCurrency(pendingAmount)}
          sub={`${pendingCount} request${pendingCount !== 1 ? 's' : ''} awaiting approval`}
          icon={<Clock className="h-4 w-4" />}
          accent="text-orange-400"
        />
      </div>

      {/* Recent signups */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.05]">
          <span className="text-sm font-semibold text-white">Recent Signups</span>
        </div>

        {recentSignups.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-zinc-600">No users yet</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_1fr_140px] gap-4 px-5 py-2 border-b border-white/[0.035]">
              <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em]">Name</span>
              <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em]">Email</span>
              <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em] text-right">Joined</span>
            </div>
            {recentSignups.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-[1fr_1fr_140px] gap-4 items-center px-5 py-3 border-b border-white/[0.035] last:border-0 hover:bg-white/[0.03] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-zinc-200 truncate">{u.full_name || '—'}</p>
                  {u.business_name && (
                    <p className="text-[10px] text-zinc-600 truncate mt-0.5">{u.business_name}</p>
                  )}
                </div>
                <p className="text-[11px] font-mono text-zinc-500 truncate">{u.email}</p>
                <p className="text-[11px] font-mono text-zinc-600 text-right whitespace-nowrap">
                  {formatDate(u.created_at)}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
