import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return adminEmails.includes(email.toLowerCase())
}

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

const ALL_STATUSES = ['all', 'draft', 'sent', 'paid', 'overdue']

interface PageProps {
  searchParams: Promise<{ status?: string; creator?: string }>
}

export default async function AdminInvoicesPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email || !isAdminEmail(user.email)) redirect('/dashboard')

  const params = await searchParams
  const statusFilter = ALL_STATUSES.includes(params.status ?? '') ? params.status : 'all'
  const creatorFilter = params.creator ?? null

  let query = supabase
    .from('cp_invoices')
    .select(`
      id,
      invoice_number,
      total,
      status,
      currency,
      created_at,
      creator_id,
      cp_clients ( name ),
      cp_users ( full_name, email )
    `)
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }
  if (creatorFilter) {
    query = query.eq('creator_id', creatorFilter)
  }

  const { data: invoices } = await query

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.16em]">Admin</p>
          <h1 className="text-base font-semibold text-white mt-0.5 font-display">Invoices</h1>
        </div>
        {creatorFilter && (
          <Link
            href="/admin/invoices"
            className="text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            Clear filter
          </Link>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/invoices?status=${s}${creatorFilter ? `&creator=${creatorFilter}` : ''}`}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              statusFilter === s
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-900/40'
                : 'bg-zinc-900 border border-white/[0.07] text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05]'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[120px_1fr_1fr_100px_80px_70px_100px] gap-4 px-5 py-2.5 border-b border-white/[0.05]">
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em]">Invoice #</span>
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em]">Creator</span>
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em]">Client</span>
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em] text-right">Amount</span>
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em] text-center">Status</span>
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em] text-center">Curr.</span>
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em] text-right">Created</span>
        </div>

        {!invoices || invoices.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-zinc-600">No invoices found.</p>
          </div>
        ) : (
          invoices.map((inv) => {
            const status = inv.status as string
            const client = (Array.isArray(inv.cp_clients) ? inv.cp_clients[0] : inv.cp_clients) as { name: string } | null
            const creator = (Array.isArray(inv.cp_users) ? inv.cp_users[0] : inv.cp_users) as { full_name: string; email: string } | null
            return (
              <div
                key={inv.id}
                className="grid grid-cols-[120px_1fr_1fr_100px_80px_70px_100px] gap-4 items-center px-5 py-3 border-b border-white/[0.035] last:border-0 hover:bg-white/[0.03] transition-colors"
              >
                <p className="text-[11px] font-mono font-semibold text-zinc-300 truncate">
                  {inv.invoice_number}
                </p>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-zinc-200 truncate">
                    {creator?.full_name || '—'}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-600 truncate mt-0.5">
                    {creator?.email || ''}
                  </p>
                </div>
                <p className="text-[12px] text-zinc-400 truncate">{client?.name || '—'}</p>
                <p className="text-[12px] font-mono font-semibold text-white text-right whitespace-nowrap">
                  {formatCurrency(inv.total ?? 0)}
                </p>
                <div className="flex items-center justify-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status] ?? 'bg-zinc-600'}`} />
                  <span className={`text-[10px] font-bold capitalize ${STATUS_TEXT[status] ?? 'text-zinc-500'}`}>
                    {status}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-zinc-600 text-center uppercase">
                  {inv.currency || 'NGN'}
                </p>
                <p className="text-[11px] font-mono text-zinc-600 text-right whitespace-nowrap">
                  {formatDate(inv.created_at)}
                </p>
              </div>
            )
          })
        )}
      </div>

      <p className="text-[11px] text-zinc-700">{invoices?.length ?? 0} invoice{(invoices?.length ?? 0) !== 1 ? 's' : ''}</p>
    </div>
  )
}
