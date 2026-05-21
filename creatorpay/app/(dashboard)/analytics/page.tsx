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
  'bg-gray-300 text-gray-700',
  'bg-gray-200 text-gray-600',
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
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-400 text-sm mt-0.5">Earnings and performance overview</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Earned" amount={total_earned} icon={TrendingUp} color="violet" />
        <StatsCard label="This Month" amount={earned_this_month} icon={Calendar} color="green" />

        {/* Growth */}
        <div className="relative bg-white rounded-xl border border-gray-100 p-5 overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${growthPositive ? 'from-emerald-500/10' : 'from-red-500/10'} to-transparent opacity-50 pointer-events-none`} />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Growth</p>
              <p className={`text-2xl font-bold leading-none ${growthPositive ? 'text-emerald-600' : 'text-red-500'}`}>{growthDisplay}</p>
              <p className="text-xs text-gray-400 mt-1.5">vs last month</p>
            </div>
            <div className={`p-2.5 rounded-xl shrink-0 ${growthPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
              {growthPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
          </div>
        </div>

        {/* Paid invoices */}
        <div className="relative bg-white rounded-xl border border-gray-100 p-5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent opacity-50 pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Paid Invoices</p>
              <p className="text-2xl font-bold text-gray-900 leading-none">
                {paid_invoice_count}
                <span className="text-sm font-normal text-gray-400 ml-1">/ {invoice_count}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1.5">total invoices</p>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Top clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Monthly Revenue</h2>
            <p className="text-xs text-gray-400 mt-0.5">Last 6 months</p>
          </div>
          <div className="px-5 py-5">
            {monthly_revenue.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-gray-400">No data yet</div>
            ) : (
              <div className="flex items-end gap-2 justify-between">
                {monthly_revenue.map((m) => {
                  const barH = Math.max(6, Math.round((m.amount / maxRevenue) * MAX_BAR))
                  return (
                    <div key={m.month} className="flex flex-col items-center gap-1.5 flex-1">
                      <span className="text-xs font-medium text-gray-500">{formatCurrency(m.amount).replace('₦', '').trim()}</span>
                      <div className="w-full bg-violet-500 rounded-t-lg transition-all" style={{ height: `${barH}px` }} />
                      <span className="text-xs text-gray-400">{m.month}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top clients */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Top Clients</h2>
            <span className="text-xs text-gray-400 ml-auto">by revenue</span>
          </div>
          {top_clients.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">No client data yet</div>
          ) : (
            <div>
              {top_clients.map((client, i) => (
                <div key={client.name} className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankColors[i] ?? 'bg-gray-200 text-gray-600'}`}>
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900 flex-1 truncate">{client.name}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(client.total)}</span>
                  <span className="text-xs text-gray-400 w-10 text-right">{((client.total / topClientsTotal) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Avg + Completion */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Invoice Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-3">{formatCurrency(avg_invoice_value)}</p>
          <p className="text-xs text-gray-400 mt-1">across all invoices</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Invoice Completion</p>
            <span className="text-sm font-bold text-gray-900">{paid_invoice_count}/{invoice_count}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${invoiceRatio}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">{invoiceRatio.toFixed(0)}% of invoices paid</p>
        </div>
      </div>
    </div>
  )
}
