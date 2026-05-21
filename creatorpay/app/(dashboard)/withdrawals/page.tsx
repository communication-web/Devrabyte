'use client'

import { useState, useEffect } from 'react'
import { ArrowDownToLine, CheckCircle, XCircle, Clock, Wallet, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Withdrawal } from '@/types'

interface StatsData {
  available_balance: number
  paid_out: number
}

export default function WithdrawalsPage() {
  const [stats, setStats] = useState<StatsData>({ available_balance: 0, paid_out: 0 })
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [userInfo, setUserInfo] = useState<{ bank_name: string; bank_account_number: string; bank_account_name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function fetchData() {
    const [statsRes, withdrawalsRes, profileRes] = await Promise.all([
      fetch('/api/dashboard/stats').then((r) => r.json()),
      fetch('/api/withdrawals').then((r) => r.json()),
      fetch('/api/profile').then((r) => r.json()),
    ])
    setStats({ available_balance: statsRes.available_balance || 0, paid_out: statsRes.paid_out || 0 })
    setWithdrawals(withdrawalsRes.withdrawals || [])
    setUserInfo(profileRes.user || null)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount'); return }
    if (amt > stats.available_balance) {
      setError(`Amount exceeds available balance of ${formatCurrency(stats.available_balance)}`)
      return
    }
    setWithdrawLoading(true)
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Withdrawal failed')
      } else {
        setSuccess('Withdrawal initiated! Funds will arrive shortly.')
        setAmount('')
        fetchData()
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setWithdrawLoading(false)
    }
  }

  const statusIcon = (s: string) => {
    if (s === 'success') return <CheckCircle className="h-4 w-4 text-emerald-400" />
    if (s === 'failed' || s === 'reversed') return <XCircle className="h-4 w-4 text-red-400" />
    return <Clock className="h-4 w-4 text-amber-400" />
  }

  const statusBadge = (s: string) => {
    if (s === 'success') return 'success' as const
    if (s === 'failed' || s === 'reversed') return 'danger' as const
    return 'warning' as const
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Withdrawals</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Move your earnings to your bank account</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative bg-zinc-900 rounded-xl border border-white/[0.07] p-5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-40 pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Available</p>
              <p className="text-2xl font-bold text-emerald-400 leading-none">{formatCurrency(stats.available_balance)}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="relative bg-zinc-900 rounded-xl border border-white/[0.07] p-5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-40 pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Total Paid Out</p>
              <p className="text-2xl font-bold text-white leading-none">{formatCurrency(stats.paid_out)}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw form */}
      {userInfo && (
        <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05]">
            <h2 className="text-sm font-semibold text-white">Withdraw funds</h2>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div className="bg-zinc-800/60 rounded-xl p-4 border border-white/[0.07]">
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Destination</p>
              <p className="text-sm font-semibold text-zinc-100">{userInfo.bank_account_name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{userInfo.bank_name} · ···{userInfo.bank_account_number.slice(-4)}</p>
            </div>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <Input
                label="Amount (₦)"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                hint={`Available: ${formatCurrency(stats.available_balance)}`}
                min={100}
                step={1}
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              {success && <p className="text-sm text-emerald-400">{success}</p>}
              <Button type="submit" loading={withdrawLoading} disabled={stats.available_balance <= 0}>
                <ArrowDownToLine className="h-4 w-4" />
                Withdraw to bank
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-sm font-semibold text-white">Withdrawal history</h2>
        </div>
        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-500">Loading…</div>
        ) : withdrawals.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-10 h-10 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ArrowDownToLine className="h-5 w-5 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500">No withdrawals yet</p>
          </div>
        ) : (
          <div>
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] last:border-0">
                <div className="flex items-center gap-3">
                  {statusIcon(w.status)}
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{formatCurrency(w.amount)}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{formatDate(w.created_at)}</p>
                  </div>
                </div>
                <Badge variant={statusBadge(w.status)}>{w.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
