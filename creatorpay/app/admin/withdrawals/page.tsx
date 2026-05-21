import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Info } from 'lucide-react'

// NOTE: Withdrawal approvals are handled manually via the Paystack dashboard.
// A placeholder API route for future automation:
//   POST /api/admin/withdrawals/[id]/approve
// would update the withdrawal status to 'success' and trigger a bank transfer.

function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return adminEmails.includes(email.toLowerCase())
}

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-amber-400',
  success: 'bg-emerald-400',
  failed:  'bg-red-400',
}

const STATUS_TEXT: Record<string, string> = {
  pending: 'text-amber-400',
  success: 'text-emerald-400',
  failed:  'text-red-400',
}

export default async function AdminWithdrawalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email || !isAdminEmail(user.email)) redirect('/dashboard')

  const { data: withdrawals } = await supabase
    .from('cp_withdrawals')
    .select(`
      id,
      amount,
      status,
      created_at,
      cp_users ( full_name, email, bank_name, bank_account_number, bank_account_name )
    `)
    .order('created_at', { ascending: false })

  const pending = (withdrawals ?? []).filter((w) => w.status === 'pending')
  const pendingTotal = pending.reduce((s, w) => s + (w.amount ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.16em]">Admin</p>
        <h1 className="text-base font-semibold text-white mt-0.5 font-display">Withdrawals</h1>
      </div>

      {/* Manual approval notice */}
      <div className="flex items-start gap-3 bg-amber-400/5 border border-amber-400/15 rounded-xl px-4 py-3.5">
        <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-amber-300">Manual approval via Paystack dashboard</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Approve pending withdrawals directly in the Paystack dashboard. Future automation:
            {' '}<code className="text-zinc-400 font-mono text-[10px]">POST /api/admin/withdrawals/[id]/approve</code>
          </p>
        </div>
      </div>

      {/* Pending summary */}
      {pending.length > 0 && (
        <div className="bg-zinc-900 rounded-xl border border-amber-400/15 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[12px] font-semibold text-amber-300">
                {pending.length} pending withdrawal{pending.length !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-[13px] font-mono font-bold text-amber-400">
              {formatCurrency(pendingTotal)}
            </span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_1fr_1fr_100px_80px_100px] gap-4 px-5 py-2.5 border-b border-white/[0.05]">
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em]">Creator</span>
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em]">Bank</span>
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em]">Account</span>
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em] text-right">Amount</span>
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em] text-center">Status</span>
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em] text-right">Date</span>
        </div>

        {!withdrawals || withdrawals.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-zinc-600">No withdrawals yet.</p>
          </div>
        ) : (
          withdrawals.map((w) => {
            const status = w.status as string
            const creator = (Array.isArray(w.cp_users) ? w.cp_users[0] : w.cp_users) as {
              full_name: string; email: string
              bank_name: string | null; bank_account_number: string | null; bank_account_name: string | null
            } | null
            return (
              <div
                key={w.id}
                className="grid grid-cols-[1fr_1fr_1fr_100px_80px_100px] gap-4 items-center px-5 py-3 border-b border-white/[0.035] last:border-0 hover:bg-white/[0.03] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-zinc-200 truncate">{creator?.full_name || '—'}</p>
                  <p className="text-[10px] font-mono text-zinc-600 truncate mt-0.5">{creator?.email || ''}</p>
                </div>
                <p className="text-[11px] text-zinc-500 truncate">{creator?.bank_name || '—'}</p>
                <div className="min-w-0">
                  <p className="text-[11px] text-zinc-400 truncate">{creator?.bank_account_name || '—'}</p>
                  <p className="text-[10px] font-mono text-zinc-600 mt-0.5">{creator?.bank_account_number || ''}</p>
                </div>
                <p className="text-[12px] font-mono font-semibold text-white text-right whitespace-nowrap">
                  {formatCurrency(w.amount ?? 0)}
                </p>
                <div className="flex items-center justify-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status] ?? 'bg-zinc-600'}`} />
                  <span className={`text-[10px] font-bold capitalize ${STATUS_TEXT[status] ?? 'text-zinc-500'}`}>
                    {status}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-zinc-600 text-right whitespace-nowrap">
                  {formatDate(w.created_at)}
                </p>
              </div>
            )
          })
        )}
      </div>

      <p className="text-[11px] text-zinc-700">{withdrawals?.length ?? 0} withdrawal{(withdrawals?.length ?? 0) !== 1 ? 's' : ''} total</p>
    </div>
  )
}
