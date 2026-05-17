import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge, invoiceStatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Invoice } from '@/types'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: invoices } = await supabase
    .from('cp_invoices')
    .select('*, cp_clients(name, company)')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 text-sm mt-0.5">{invoices?.length || 0} total</p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="h-4 w-4" />
            New invoice
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <span>Invoice</span>
            <span>Client</span>
            <span>Due date</span>
            <span>Amount</span>
            <span>Status</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!invoices || invoices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No invoices yet.</p>
              <Link href="/invoices/new" className="text-violet-600 text-sm hover:underline mt-1 inline-block">
                Create your first invoice
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {(invoices as (Invoice & { cp_clients: { name: string; company: string | null } | null })[]).map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 items-center px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{inv.invoice_number}</p>
                    <p className="text-xs text-gray-400">{formatDate(inv.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{inv.cp_clients?.name || '—'}</p>
                    {inv.cp_clients?.company && <p className="text-xs text-gray-400">{inv.cp_clients.company}</p>}
                  </div>
                  <p className="text-sm text-gray-600">{formatDate(inv.due_date)}</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(inv.total)}</p>
                  <Badge variant={invoiceStatusBadge(inv.status)}>{inv.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
