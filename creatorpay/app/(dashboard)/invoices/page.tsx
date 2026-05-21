import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { Badge, invoiceStatusBadge } from '@/components/ui/badge'
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

  const counts = {
    all: invoices?.length || 0,
    draft: invoices?.filter((i) => i.status === 'draft').length || 0,
    sent: invoices?.filter((i) => i.status === 'sent').length || 0,
    paid: invoices?.filter((i) => i.status === 'paid').length || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{counts.all} total · {counts.paid} paid · {counts.sent} sent · {counts.draft} draft</p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-violet-500 transition-colors shadow-sm shadow-violet-900/40"
        >
          <Plus className="h-4 w-4" />
          New invoice
        </Link>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        {!invoices || invoices.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-zinc-500 mb-1">No invoices yet</p>
            <Link href="/invoices/new" className="text-sm text-violet-400 hover:text-violet-300 font-medium">
              Create your first invoice →
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 items-center px-5 py-3 border-b border-white/[0.05]">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Invoice</span>
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Client</span>
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Due</span>
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Amount</span>
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</span>
            </div>
            <div>
              {(invoices as (Invoice & { cp_clients: { name: string; company: string | null } | null })[]).map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-white/[0.04] transition-colors border-b border-white/[0.05] last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{inv.invoice_number}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{formatDate(inv.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300">{inv.cp_clients?.name || '—'}</p>
                    {inv.cp_clients?.company && <p className="text-xs text-zinc-500">{inv.cp_clients.company}</p>}
                  </div>
                  <p className="text-sm text-zinc-400 whitespace-nowrap">{formatDate(inv.due_date)}</p>
                  <p className="text-sm font-semibold text-white whitespace-nowrap">{formatCurrency(inv.total)}</p>
                  <Badge variant={invoiceStatusBadge(inv.status)}>{inv.status}</Badge>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
