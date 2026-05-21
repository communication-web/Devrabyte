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

  const inv = invoice as Invoice & { cp_clients: { name: string; email: string; company: string | null; phone: string | null } | null; currency?: string }
  const currencySymbol = inv.currency === 'USD' ? '$' : '₦'

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/invoices" className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors border border-transparent hover:border-white/[0.07]">
          <ArrowLeft className="h-4 w-4 text-zinc-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white">{inv.invoice_number}</h1>
            <Badge variant={invoiceStatusBadge(inv.status)}>{inv.status}</Badge>
          </div>
          <p className="text-zinc-500 text-xs mt-0.5">Created {formatDate(inv.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          {inv.status === 'draft' && <SendInvoiceButton invoiceId={inv.id} />}
          {inv.status === 'sent' && !inv.advance_requested && <RequestAdvanceButton invoice={inv} />}
          {inv.advance_requested && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg font-medium">
              <Zap className="h-3.5 w-3.5" />
              Advance requested
            </div>
          )}
        </div>
      </div>

      {/* Payment link banner */}
      {inv.paystack_payment_link && (
        <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-300">Payment link ready</p>
            <p className="text-violet-400 text-xs mt-0.5">Share with your client to collect payment</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(inv.paystack_payment_link!)}
              className="flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-200 font-medium bg-violet-600/20 border border-violet-500/20 px-3 py-2 rounded-lg transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy link
            </button>
            <a
              href={inv.paystack_payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-medium"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
          </div>
        </div>
      )}

      {/* Client + Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-xl border border-white/[0.07] p-5">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Client</p>
          <p className="font-semibold text-white">{inv.cp_clients?.name || '—'}</p>
          {inv.cp_clients?.company && (
            <div className="flex items-center gap-1.5 text-sm text-zinc-400 mt-1.5">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {inv.cp_clients.company}
            </div>
          )}
          {inv.cp_clients?.email && (
            <div className="flex items-center gap-1.5 text-sm text-zinc-400 mt-1">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {inv.cp_clients.email}
            </div>
          )}
          {inv.cp_clients?.phone && (
            <div className="flex items-center gap-1.5 text-sm text-zinc-400 mt-1">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {inv.cp_clients.phone}
            </div>
          )}
        </div>

        <div className="bg-zinc-900 rounded-xl border border-white/[0.07] p-5">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Details</p>
          <div className="space-y-2.5">
            {[
              { label: 'Invoice #', value: inv.invoice_number },
              { label: 'Due date', value: formatDate(inv.due_date) },
              { label: 'Currency', value: inv.currency || 'NGN' },
              { label: 'Status', value: <Badge variant={invoiceStatusBadge(inv.status)}>{inv.status}</Badge> },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{label}</span>
                <span className="text-sm font-medium text-zinc-100">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="grid grid-cols-[1fr_72px_120px_120px] gap-4 items-center px-5 py-3.5 border-b border-white/[0.05]">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Description</span>
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Qty</span>
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Unit price</span>
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Amount</span>
        </div>
        {(inv.line_items as LineItem[]).map((item, i) => (
          <div key={i} className="grid grid-cols-[1fr_72px_120px_120px] gap-4 items-center px-5 py-3.5 border-b border-white/[0.05] last:border-0 text-sm">
            <span className="text-zinc-100">{item.description}</span>
            <span className="text-zinc-400">{item.quantity}</span>
            <span className="text-zinc-400">{currencySymbol}{item.unit_price.toLocaleString()}</span>
            <span className="text-right font-medium text-white">{currencySymbol}{(item.quantity * item.unit_price).toLocaleString()}</span>
          </div>
        ))}
        <div className="px-5 py-4 border-t border-white/[0.05] space-y-2 bg-zinc-800/40">
          <div className="flex justify-between text-sm text-zinc-400">
            <span>Subtotal</span><span>{formatCurrency(inv.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-zinc-500">
            <span>Platform fee (1.5%)</span><span>{formatCurrency(inv.platform_fee)}</span>
          </div>
          <div className="flex justify-between font-bold text-white text-base pt-1 border-t border-white/[0.05]">
            <span>Total</span><span>{formatCurrency(inv.total)}</span>
          </div>
        </div>
      </div>

      <Link
        href={`/invoice/${inv.invoice_number}`}
        target="_blank"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        View client page
      </Link>
    </div>
  )
}
