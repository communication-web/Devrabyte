import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Badge, invoiceStatusBadge } from '@/components/ui/badge'
import { TrendingUp, Wallet, Clock, ArrowDownToLine, Plus, ArrowRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [statsRes, userData, invoicesRes, txRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard/stats`, {
      headers: { Cookie: '' },
      cache: 'no-store',
    }).catch(() => null),
    supabase.from('cp_users').select('full_name, business_name').eq('id', user.id).single(),
    supabase
      .from('cp_invoices')
      .select('*, cp_clients(name)')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('cp_transactions')
      .select('*')
      .eq('creator_id', user.id)
      .eq('status', 'success')
      .order('paid_at', { ascending: false })
      .limit(5),
  ])

  const stats = statsRes?.ok ? await statsRes.json() : { total_earned: 0, available_balance: 0, pending_amount: 0, paid_out: 0 }
  const profile = userData.data
  const invoices = invoicesRes.data || []
  const transactions = txRes.data || []

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500 mb-0.5">{greeting}</p>
          <h1 className="text-2xl font-bold text-white">{firstName} 👋</h1>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-violet-500 transition-colors shadow-sm shadow-violet-900/40"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Earned" amount={stats.total_earned} icon={TrendingUp} color="violet" />
        <StatsCard label="Available Balance" amount={stats.available_balance} icon={Wallet} color="green" />
        <StatsCard label="Pending" amount={stats.pending_amount} icon={Clock} color="yellow" subtitle="Awaiting payment" />
        <StatsCard label="Paid Out" amount={stats.paid_out} icon={ArrowDownToLine} color="blue" />
      </div>

      {/* Cards row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Invoices */}
        <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <h2 className="text-sm font-semibold text-white">Recent Invoices</h2>
            <Link href="/invoices" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {invoices.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-5 w-5 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500 mb-1">No invoices yet</p>
              <Link href="/invoices/new" className="text-xs text-violet-400 hover:text-violet-300 font-medium">
                Create your first invoice →
              </Link>
            </div>
          ) : (
            <div>
              {invoices.map((inv: Record<string, unknown>) => (
                <Link
                  key={inv.id as string}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.05] last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{inv.invoice_number as string}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {(inv.cp_clients as { name: string } | null)?.name || '—'} · {formatDate(inv.created_at as string)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{formatCurrency(inv.total as number)}</p>
                    <Badge variant={invoiceStatusBadge(inv.status as string)} className="mt-1">
                      {inv.status as string}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05]">
            <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
          </div>
          {transactions.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Wallet className="h-5 w-5 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500">No payments received yet</p>
            </div>
          ) : (
            <div>
              {transactions.map((tx: Record<string, unknown>) => (
                <div key={tx.id as string} className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{tx.paystack_reference as string}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 capitalize">
                      {tx.paystack_channel as string} · {formatDate(tx.paid_at as string)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">+{formatCurrency(tx.creator_amount as number)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
