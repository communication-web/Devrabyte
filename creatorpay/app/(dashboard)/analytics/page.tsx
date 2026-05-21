import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TrendingUp, Calendar, FileText, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { AnalyticsStats } from '@/types'

const EMPTY_STATS: AnalyticsStats = {
  total_earned: 0,
  earned_this_month: 0,
  earned_last_month: 0,
  invoice_count: 0,
  paid_invoice_count: 0,
  avg_invoice_value: 0,
  top_clients: [],
  monthly_revenue: [],
}

const rankColors = ['bg-violet-500', 'bg-blue-500', 'bg-green-500', 'bg-gray-400', 'bg-gray-400']

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let stats: AnalyticsStats = EMPTY_STATS
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analytics`, {
      cache: 'no-store',
    })
    if (res.ok) {
      stats = await res.json()
    }
  } catch {
    // fall through to empty stats
  }

  const {
    total_earned,
    earned_this_month,
    earned_last_month,
    invoice_count,
    paid_invoice_count,
    avg_invoice_value,
    top_clients,
    monthly_revenue,
  } = stats

  // Growth %
  const growth = earned_last_month === 0
    ? earned_this_month > 0 ? 100 : 0
    : ((earned_this_month - earned_last_month) / earned_last_month) * 100
  const growthPositive = growth >= 0
  const growthDisplay = `${growthPositive ? '+' : ''}${growth.toFixed(1)}%`

  // Bar chart
  const maxRevenue = Math.max(...monthly_revenue.map((m) => m.amount), 1)
  const MAX_BAR_HEIGHT = 120

  // Invoice progress
  const invoiceRatio = invoice_count > 0 ? (paid_invoice_count / invoice_count) * 100 : 0

  // Top clients total for percentage
  const topClientsTotal = top_clients.reduce((sum, c) => sum + c.total, 0) || 1

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your earnings and performance overview</p>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Earned"
          amount={total_earned}
          icon={TrendingUp}
          color="violet"
        />
        <StatsCard
          label="This Month"
          amount={earned_this_month}
          icon={Calendar}
          color="green"
        />

        {/* Growth card — custom because it shows % not currency */}
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className={`p-3 rounded-xl ${growthPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Growth</p>
              <p className={`text-xl font-bold ${growthPositive ? 'text-green-600' : 'text-red-600'}`}>
                {growthDisplay}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">vs last month</p>
            </div>
          </CardContent>
        </Card>

        {/* Paid invoices card */}
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid Invoices</p>
              <p className="text-xl font-bold text-gray-900">
                {paid_invoice_count}
                <span className="text-sm font-normal text-gray-400"> / {invoice_count}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">total invoices</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Bar Chart + Top Clients — side by side on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Monthly Revenue</h2>
            <p className="text-xs text-gray-400">Last 6 months</p>
          </CardHeader>
          <CardContent>
            {monthly_revenue.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                No revenue data yet.
              </div>
            ) : (
              <div className="flex items-end gap-2 justify-between pt-2">
                {monthly_revenue.map((m) => {
                  const barHeight = Math.max(4, Math.round((m.amount / maxRevenue) * MAX_BAR_HEIGHT))
                  return (
                    <div key={m.month} className="flex flex-col items-center gap-1 flex-1">
                      <div
                        className="w-full bg-violet-500 rounded-t-lg"
                        style={{ height: `${barHeight}px` }}
                        title={formatCurrency(m.amount)}
                      />
                      <span className="text-xs text-gray-500">{m.month}</span>
                      <span className="text-xs text-gray-400">{formatCurrency(m.amount)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Clients table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Top Clients</h2>
            </div>
            <p className="text-xs text-gray-400">By revenue</p>
          </CardHeader>
          <CardContent className="p-0">
            {top_clients.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">
                No client data yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-2 text-left text-xs text-gray-400 font-medium">Rank</th>
                    <th className="px-2 py-2 text-left text-xs text-gray-400 font-medium">Client</th>
                    <th className="px-2 py-2 text-right text-xs text-gray-400 font-medium">Revenue</th>
                    <th className="px-6 py-2 text-right text-xs text-gray-400 font-medium">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {top_clients.map((client, i) => (
                    <tr key={client.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-semibold ${rankColors[i] ?? 'bg-gray-400'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-2 py-3 font-medium text-gray-900">{client.name}</td>
                      <td className="px-2 py-3 text-right text-gray-700">{formatCurrency(client.total)}</td>
                      <td className="px-6 py-3 text-right text-gray-400">
                        {((client.total / topClientsTotal) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Avg invoice value */}
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-gray-500">Avg Invoice Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(avg_invoice_value)}</p>
            <p className="text-xs text-gray-400 mt-1">across all invoices</p>
          </CardContent>
        </Card>

        {/* Paid / Total ratio with progress bar */}
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Invoice Completion</p>
              <span className="text-sm font-semibold text-gray-900">
                {paid_invoice_count} / {invoice_count}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-violet-500 h-2 rounded-full transition-all"
                style={{ width: `${invoiceRatio}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{invoiceRatio.toFixed(0)}% of invoices paid</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
