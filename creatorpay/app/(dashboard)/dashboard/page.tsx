import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MetricsBand } from '@/components/dashboard/metrics-band'
import { Plus, ChevronRight, FileText, Wallet, Zap, BarChart2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

const STATUS_DOT: Record<string, string> = {
  draft:   'bg-zinc-600',
  sent:    'bg-amber-400',
  paid:    'bg-emerald-400',
  overdue: 'bg-red-400',
}

const STATUS_TEXT: Record<string, string> = {
  draft:   'text-zinc-500',
  sent:    'text-amber-400',
  paid:    'text-emerald-400',
  overdue: 'text-red-400',
}

function timeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

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
      .select('id, invoice_number, status, total, due_date, created_at, cp_clients(name)')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('cp_transactions')
      .select('id, paystack_reference, paystack_channel, creator_amount, paid_at')
      .eq('creator_id', user.id)
      .eq('status', 'success')
      .order('paid_at', { ascending: false })
      .limit(6),
  ])

  const stats = statsRes?.ok ? await statsRes.json() : { total_earned: 0, available_balance: 0, pending_amount: 0, paid_out: 0 }
  const profile = userData.data
  const invoices = (invoicesRes.data || []) as Record<string, unknown>[]
  const transactions = (txRes.data || []) as Record<string, unknown>[]

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const paidCount  = invoices.filter((i) => i.status === 'paid').length
  const sentCount  = invoices.filter((i) => i.status === 'sent').length
  const draftCount = invoices.filter((i) => i.status === 'draft').length

  return (
    <div className="space-y-5">
      {/* Header — compact, operational */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.16em]">{dateStr}</p>
          <h1 className="text-base font-semibold text-white mt-0.5">
            {firstName}{' '}
            <span className="text-zinc-500 font-normal">— your workspace</span>
          </h1>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-1.5 bg-violet-600 text-white px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-violet-500 active:scale-95 transition-all shadow-sm shadow-violet-900/40"
        >
          <Plus className="h-3.5 w-3.5" />
          New Invoice
        </Link>
      </div>

      {/* Metrics instrument band — one unified surface */}
      <MetricsBand
        totalEarned={stats.total_earned}
        availableBalance={stats.available_balance}
        pendingAmount={stats.pending_amount}
        paidOut={stats.paid_out}
      />

      {/* Main workspace grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_288px] gap-5">

        {/* Invoice pipeline */}
        <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-white">Invoice Pipeline</span>
              {sentCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {sentCount} active
                </span>
              )}
            </div>
            <Link href="/invoices" className="inline-flex items-center gap-0.5 text-[11px] text-zinc-600 hover:text-zinc-300 font-medium transition-colors">
              All invoices <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {invoices.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="h-4 w-4 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500 mb-2.5">No invoices yet</p>
              <Link href="/invoices/new" className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                Create your first invoice
              </Link>
            </div>
          ) : (
            <>
              {/* Column labels */}
              <div className="grid grid-cols-[16px_1fr_100px_88px_72px] gap-4 items-center px-5 py-2 border-b border-white/[0.035]">
                <span />
                <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em]">Invoice</span>
                <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em]">Due</span>
                <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em] text-right">Amount</span>
                <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em] text-right">Status</span>
              </div>

              {invoices.map((inv) => {
                const status = inv.status as string
                return (
                  <Link
                    key={inv.id as string}
                    href={`/invoices/${inv.id}`}
                    className="grid grid-cols-[16px_1fr_100px_88px_72px] gap-4 items-center px-5 py-2.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.035] last:border-0 group"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status] ?? 'bg-zinc-600'}`} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono font-semibold text-zinc-100 group-hover:text-white transition-colors">
                        {inv.invoice_number as string}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5 truncate">
                        {(inv.cp_clients as { name: string } | null)?.name || 'No client'}
                      </p>
                    </div>
                    <p className="text-[11px] font-mono text-zinc-500 whitespace-nowrap">
                      {formatDate(inv.due_date as string)}
                    </p>
                    <p className="text-[12px] font-mono font-semibold text-white text-right whitespace-nowrap">
                      {formatCurrency(inv.total as number)}
                    </p>
                    <p className={`text-[10px] font-bold text-right capitalize ${STATUS_TEXT[status] ?? 'text-zinc-500'}`}>
                      {status}
                    </p>
                  </Link>
                )
              })}
            </>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Payment activity */}
          <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-white/[0.05]">
              <span className="text-sm font-semibold text-white">Payments</span>
            </div>
            {transactions.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Wallet className="h-3.5 w-3.5 text-zinc-600" />
                </div>
                <p className="text-xs text-zinc-600">No payments yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {transactions.map((tx) => (
                  <div key={tx.id as string} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono text-zinc-400 truncate">
                        ···{(tx.paystack_reference as string)?.slice(-8)}
                      </p>
                      <p className="text-[9px] text-zinc-600 mt-0.5 capitalize">
                        {(tx.paystack_channel as string) || 'card'} · {timeAgo(tx.paid_at as string)}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0 whitespace-nowrap">
                      +{formatCurrency(tx.creator_amount as number)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoice status counts */}
          <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-white/[0.05]">
              <span className="text-sm font-semibold text-white">Overview</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {[
                { label: 'Paid', count: paidCount, dot: 'bg-emerald-400', val: 'text-emerald-400' },
                { label: 'Sent', count: sentCount, dot: 'bg-amber-400', val: 'text-amber-400' },
                { label: 'Draft', count: draftCount, dot: 'bg-zinc-600', val: 'text-zinc-400' },
              ].map(({ label, count, dot, val }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    <span className="text-xs text-zinc-400">{label}</span>
                  </div>
                  <span className={`text-sm font-mono font-bold tabular-nums ${val}`}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-white/[0.05]">
              <span className="text-sm font-semibold text-white">Quick actions</span>
            </div>
            <div className="p-3 space-y-2">
              <Link
                href="/invoices/new"
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg bg-violet-600/10 border border-violet-500/20 text-xs font-semibold text-violet-300 hover:bg-violet-600/20 hover:border-violet-500/40 active:scale-[0.98] transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                New invoice
              </Link>
              <Link
                href="/withdrawals"
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.07] text-xs font-semibold text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 active:scale-[0.98] transition-all"
              >
                <Wallet className="h-3.5 w-3.5" />
                Withdraw funds
              </Link>
              <Link
                href="/analytics"
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.07] text-xs font-semibold text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 active:scale-[0.98] transition-all"
              >
                <BarChart2 className="h-3.5 w-3.5" />
                View analytics
              </Link>
              <Link
                href="/advance"
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.07] text-xs font-semibold text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 active:scale-[0.98] transition-all"
              >
                <Zap className="h-3.5 w-3.5" />
                Request advance
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
