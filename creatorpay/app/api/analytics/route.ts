import { createClient } from '@/lib/supabase/server'
import { AnalyticsStats } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

    // Build 6-month window
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

    const [allTxRes, thisMonthTxRes, lastMonthTxRes, invoiceCountRes, paidInvoiceCountRes, avgInvoiceRes, topClientsRes, monthlyTxRes] = await Promise.all([
      // All-time earnings
      supabase
        .from('cp_transactions')
        .select('creator_amount')
        .eq('creator_id', user.id)
        .eq('status', 'success'),

      // This month's earnings
      supabase
        .from('cp_transactions')
        .select('creator_amount')
        .eq('creator_id', user.id)
        .eq('status', 'success')
        .gte('paid_at', thisMonthStart),

      // Last month's earnings
      supabase
        .from('cp_transactions')
        .select('creator_amount')
        .eq('creator_id', user.id)
        .eq('status', 'success')
        .gte('paid_at', lastMonthStart)
        .lte('paid_at', lastMonthEnd),

      // Total invoice count
      supabase
        .from('cp_invoices')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', user.id),

      // Paid invoice count
      supabase
        .from('cp_invoices')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('status', 'paid'),

      // Average invoice value
      supabase
        .from('cp_invoices')
        .select('total')
        .eq('creator_id', user.id),

      // Top clients by revenue — join invoices + clients
      supabase
        .from('cp_invoices')
        .select('total, cp_clients(name)')
        .eq('creator_id', user.id)
        .eq('status', 'paid'),

      // Monthly transactions for last 6 months
      supabase
        .from('cp_transactions')
        .select('creator_amount, paid_at')
        .eq('creator_id', user.id)
        .eq('status', 'success')
        .gte('paid_at', sixMonthsAgo),
    ])

    // Total earned
    const total_earned = (allTxRes.data || []).reduce((sum, tx) => sum + (tx.creator_amount || 0), 0)

    // This month / last month
    const earned_this_month = (thisMonthTxRes.data || []).reduce((sum, tx) => sum + (tx.creator_amount || 0), 0)
    const earned_last_month = (lastMonthTxRes.data || []).reduce((sum, tx) => sum + (tx.creator_amount || 0), 0)

    // Invoice counts
    const invoice_count = invoiceCountRes.count ?? 0
    const paid_invoice_count = paidInvoiceCountRes.count ?? 0

    // Average invoice value
    const allInvoices = avgInvoiceRes.data || []
    const avg_invoice_value = allInvoices.length > 0
      ? allInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / allInvoices.length
      : 0

    // Top 5 clients by revenue
    const clientRevenue: Record<string, number> = {}
    for (const inv of (topClientsRes.data || [])) {
      const clientData = inv.cp_clients as unknown as { name: string } | null
      const name = clientData?.name || 'Unknown'
      clientRevenue[name] = (clientRevenue[name] || 0) + (inv.total || 0)
    }
    const top_clients = Object.entries(clientRevenue)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    // Monthly revenue for last 6 months
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyMap: Record<string, number> = {}

    // Pre-fill all 6 months with 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyMap[key] = 0
    }

    for (const tx of (monthlyTxRes.data || [])) {
      if (!tx.paid_at) continue
      const d = new Date(tx.paid_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (key in monthlyMap) {
        monthlyMap[key] = (monthlyMap[key] || 0) + (tx.creator_amount || 0)
      }
    }

    const monthly_revenue = Object.entries(monthlyMap).map(([key, amount]) => {
      const monthIndex = parseInt(key.split('-')[1], 10) - 1
      return { month: monthLabels[monthIndex], amount }
    })

    const analytics: AnalyticsStats = {
      total_earned,
      earned_this_month,
      earned_last_month,
      invoice_count,
      paid_invoice_count,
      avg_invoice_value,
      top_clients,
      monthly_revenue,
    }

    return Response.json(analytics)
  } catch (error) {
    console.error('Analytics error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
