import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Copy, Zap, Mail, Phone, Building2 } from 'lucide-react'
import { Badge, invoiceStatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Invoice, LineItem } from '@/types'
import { SendInvoiceButton } from './send-invoice-button'
import { RequestAdvanceButton } from './request-advance-button'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: invoice } = await supabase
    .from('cp_invoices')
    .select('*, cp_clients(*)')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (!invoice) notFound()

  const inv = invoice as Invoice & { cp_clients: { name: string; email: string; company: string | null; phone: string | null } | null }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/invoices" className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-gray-900">{inv.invoice_number}</h1>
            <Badge variant={invoiceStatusBadge(inv.status)}>{inv.status}</Badge>
          </div>
          <p className="text-gray-400 text-xs mt-0.5">Created {formatDate(inv.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          {inv.status === 'draft' && <SendInvoiceButton invoiceId={inv.id} />}
          {inv.status === 'sent' && !inv.advance_requested && <RequestAdvanceButton invoice={inv} />}
          {inv.advance_requested && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg font-medium">
              <Zap className="h-3.5 w-3.5" />
              Advance requested
            </div>
          )}
        </div>
      </div>

      {/* Payment link banner */}
      {inv.paystack_payment_link && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-900">Payment link ready</p>
            <p className="text-violet-600 text-xs mt-0.5">Share with your client to collect payment</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(inv.paystack_payment_link!)}
              className="flex items-center gap-1.5 text-xs text-violet-700 hover:text-violet-900 font-medium bg-white border border-violet-200 px-3 py-2 rounded-lg transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy link
            </button>
            <a
              href={inv.paystack_payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-violet-700 hover:text-violet-900 font-medium"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
          </div>
        </div>
      )}

      {/* Client + Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Client</p>
          <p className="font-semibold text-gray-900">{inv.cp_clients?.name || '—'}</p>
          {inv.cp_clients?.company && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1.5">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {inv.cp_clients.company}
            </div>
          )}
          {inv.cp_clients?.email && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {inv.cp_clients.email}
            </div>
          )}
          {inv.cp_clients?.phone && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {inv.cp_clients.phone}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Details</p>
          <div className="space-y-2.5">
            {[
              { label: 'Invoice #', value: inv.invoice_number },
              { label: 'Due date', value: formatDate(inv.due_date) },
              { label: 'Status', value: <Badge variant={invoiceStatusBadge(inv.status)}>{inv.status}</Badge> },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{label}</span>
                <span className="text-sm font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-[1fr_72px_120px_120px] gap-4 items-center px-5 py-3.5 border-b border-gray-50">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Description</span>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Qty</span>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Unit price</span>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">Amount</span>
        </div>
        {(inv.line_items as LineItem[]).map((item, i) => (
          <div key={i} className="grid grid-cols-[1fr_72px_120px_120px] gap-4 items-center px-5 py-3.5 border-b border-gray-50 last:border-0 text-sm">
            <span className="text-gray-900">{item.description}</span>
            <span className="text-gray-500">{item.quantity}</span>
            <span className="text-gray-500">{formatCurrency(item.unit_price)}</span>
            <span className="text-right font-medium text-gray-900">{formatCurrency(item.quantity * item.unit_price)}</span>
          </div>
        ))}
        <div className="px-5 py-4 border-t border-gray-50 space-y-2 bg-gray-50/50">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span><span>{formatCurrency(inv.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Platform fee (1.5%)</span><span>{formatCurrency(inv.platform_fee)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
            <span>Total</span><span>{formatCurrency(inv.total)}</span>
          </div>
        </div>
      </div>

      <Link
        href={`/invoice/${inv.invoice_number}`}
        target="_blank"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        View client page
      </Link>
    </div>
  )
}
