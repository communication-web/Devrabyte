'use client'

import { useState, useEffect } from 'react'
import { ArrowDownToLine, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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

    if (isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount')
      return
    }
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
    if (s === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />
    if (s === 'failed' || s === 'reversed') return <XCircle className="h-4 w-4 text-red-500" />
    return <Clock className="h-4 w-4 text-yellow-500" />
  }

  const statusBadge = (s: string) => {
    if (s === 'success') return 'success' as const
    if (s === 'failed' || s === 'reversed') return 'danger' as const
    return 'warning' as const
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Withdrawals</h1>
        <p className="text-gray-500 text-sm mt-0.5">Move your earnings to your bank account</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-gray-500">Available balance</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats.available_balance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-gray-500">Total paid out</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.paid_out)}</p>
          </CardContent>
        </Card>
      </div>

      {userInfo && (
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Withdraw funds</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase font-medium mb-2">Destination account</p>
              <p className="font-medium text-gray-900">{userInfo.bank_account_name}</p>
              <p className="text-sm text-gray-500">{userInfo.bank_name} · {userInfo.bank_account_number}</p>
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
              <Button
                type="submit"
                loading={withdrawLoading}
                disabled={stats.available_balance <= 0}
              >
                <ArrowDownToLine className="h-4 w-4" />
                Withdraw to bank
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900">Withdrawal history</h2></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">Loading...</div>
          ) : withdrawals.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">No withdrawals yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    {statusIcon(w.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(w.amount)}</p>
                      <p className="text-xs text-gray-400">{formatDate(w.created_at)}</p>
                    </div>
                  </div>
                  <Badge variant={statusBadge(w.status)}>{w.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
