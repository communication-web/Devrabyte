import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatsCard } from '@/components/dashboard/stats-card'
import { TrendingUp, Calendar, FileText, Users, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { AnalyticsStats } from '@/types'

const EMPTY_STATS: AnalyticsStats = {
  total_earned: 0, earned_this_month: 0, earned_last_month: 0,
  invoice_count: 0, paid_invoice_count: 0, avg_invoice_value: 0,
  top_clients: [], monthly_revenue: [],
}

const rankColors = [
  'bg-violet-500 text-white',
  'bg-blue-500 text-white',
  'bg-emerald-500 text-white',
  'bg-zinc-600 text-zinc-200',
  'bg-zinc-700 text-zinc-300',
]

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let stats: AnalyticsStats = EMPTY_STATS
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analytics`, { cache: 'no-store' })
    if (res.ok) stats = await res.json()
  } catch { /* fall through */ }

  const {
    total_earned, earned_this_month, earned_last_month,
    invoice_count, paid_invoice_count, avg_invoice_value,
    top_clients, monthly_revenue,
  } = stats

  const growth = earned_last_month === 0
    ? earned_this_month > 0 ? 100 : 0
    : ((earned_this_month - earned_last_month) / earned_last_month) * 100
  const growthPositive = growth >= 0
  const growthDisplay = `${growthPositive ? '+' : ''}${growth.toFixed(1)}%`

  const maxRevenue = Math.max(...monthly_revenue.map((m) => m.amount), 1)
  const MAX_BAR = 100
  const invoiceRatio = invoice_count > 0 ? (paid_invoice_count / invoice_count) * 100 : 0
  const topClientsTotal = top_clients.reduce((sum, c) => sum + c.total, 0) || 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Earnings and performance overview</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Earned" amount={total_earned} icon={TrendingUp} color="violet" />
        <StatsCard label="This Month" amount={earned_this_month} icon={Calendar} color="green" />

        {/* Growth */}
        <div className="relative bg-zinc-900 rounded-xl border border-white/[0.07] p-5 overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${growthPositive ? 'from-emerald-500/10' : 'from-red-500/10'} to-transparent opacity-40 pointer-events-none`} />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Growth</p>
              <p className={`text-2xl font-bold leading-none ${growthPositive ? 'text-emerald-400' : 'text-red-400'}`}>{growthDisplay}</p>
              <p className="text-xs text-zinc-500 mt-1.5">vs last month</p>
            </div>
            <div className={`p-2.5 rounded-xl shrink-0 ${growthPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {growthPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
          </div>
        </div>

        {/* Paid invoices */}
        <div className="relative bg-zinc-900 rounded-xl border border-white/[0.07] p-5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent opacity-40 pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Paid Invoices</p>
              <p className="text-2xl font-bold text-white leading-none">
                {paid_invoice_count}
                <span className="text-sm font-normal text-zinc-500 ml-1">/ {invoice_count}</span>
              </p>
              <p className="text-xs text-zinc-500 mt-1.5">total invoices</p>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Top clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar chart */}
        <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05]">
            <h2 className="text-sm font-semibold text-white">Monthly Revenue</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Last 6 months</p>
          </div>
          <div className="px-5 py-5">
            {monthly_revenue.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-zinc-500">No data yet</div>
            ) : (
              <div className="flex items-end gap-2 justify-between">
                {monthly_revenue.map((m) => {
                  const barH = Math.max(6, Math.round((m.amount / maxRevenue) * MAX_BAR))
                  return (
                    <div key={m.month} className="flex flex-col items-center gap-1.5 flex-1">
                      <span className="text-xs font-medium text-zinc-400">{formatCurrency(m.amount).replace('₦', '').trim()}</span>
                      <div className="w-full bg-violet-500 rounded-t-lg transition-all opacity-80" style={{ height: `${barH}px` }} />
                      <span className="text-xs text-zinc-500">{m.month}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top clients */}
        <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-white">Top Clients</h2>
            <span className="text-xs text-zinc-500 ml-auto">by revenue</span>
          </div>
          {top_clients.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-zinc-500">No client data yet</div>
          ) : (
            <div>
              {top_clients.map((client, i) => (
                <div key={client.name} className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.05] last:border-0 hover:bg-white/[0.04] transition-colors">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankColors[i] ?? 'bg-zinc-700 text-zinc-300'}`}>
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-zinc-100 flex-1 truncate">{client.name}</span>
                  <span className="text-sm font-semibold text-white">{formatCurrency(client.total)}</span>
                  <span className="text-xs text-zinc-500 w-10 text-right">{((client.total / topClientsTotal) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Avg + Completion */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-xl border border-white/[0.07] p-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Avg Invoice Value</p>
          <p className="text-2xl font-bold text-white mt-3">{formatCurrency(avg_invoice_value)}</p>
          <p className="text-xs text-zinc-500 mt-1">across all invoices</p>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-white/[0.07] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Invoice Completion</p>
            <span className="text-sm font-bold text-white">{paid_invoice_count}/{invoice_count}</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${invoiceRatio}%` }} />
          </div>
          <p className="text-xs text-zinc-500 mt-2">{invoiceRatio.toFixed(0)}% of invoices paid</p>
        </div>
      </div>
    </div>
  )
}
