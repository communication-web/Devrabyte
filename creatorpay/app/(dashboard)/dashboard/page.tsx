import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge, invoiceStatusBadge } from '@/components/ui/badge'
import { TrendingUp, Wallet, Clock, ArrowDownToLine } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [statsRes, invoicesRes, txRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard/stats`, {
      headers: { Cookie: '' },
      cache: 'no-store',
    }).catch(() => null),
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
  const invoices = invoicesRes.data || []
  const transactions = txRes.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back</p>
        </div>
        <Link href="/invoices/new">
          <Button>New Invoice</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Earned" amount={stats.total_earned} icon={TrendingUp} color="violet" />
        <StatsCard label="Available Balance" amount={stats.available_balance} icon={Wallet} color="green" />
        <StatsCard label="Pending" amount={stats.pending_amount} icon={Clock} color="yellow" subtitle="Sent, awaiting payment" />
        <StatsCard label="Paid Out" amount={stats.paid_out} icon={ArrowDownToLine} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Invoices</h2>
              <Link href="/invoices" className="text-sm text-violet-600 hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">
                No invoices yet.{' '}
                <Link href="/invoices/new" className="text-violet-600 hover:underline">Create your first</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {invoices.map((inv: Record<string, unknown>) => (
                  <Link
                    key={inv.id as string}
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.invoice_number as string}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {(inv.cp_clients as { name: string } | null)?.name || '—'} · {formatDate(inv.created_at as string)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(inv.total as number)}</p>
                      <Badge variant={invoiceStatusBadge(inv.status as string)} className="mt-1">
                        {inv.status as string}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">No payments received yet.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {transactions.map((tx: Record<string, unknown>) => (
                  <div key={tx.id as string} className="flex items-center justify-between px-6 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.paystack_reference as string}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {tx.paystack_channel as string} · {formatDate(tx.paid_at as string)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-green-600">+{formatCurrency(tx.creator_amount as number)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
