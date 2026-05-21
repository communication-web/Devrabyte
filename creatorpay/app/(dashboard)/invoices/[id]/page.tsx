import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Copy, Zap, Mail, Phone, Building2, Shield, Clock, CheckCircle2, AlertTriangle, Truck } from 'lucide-react'
import { Badge, invoiceStatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Invoice, LineItem } from '@/types'
import { SendInvoiceButton } from './send-invoice-button'
import { RequestAdvanceButton } from './request-advance-button'
import { ShareInvoiceButton } from './share-invoice-button'
import { DeliverButton } from './deliver-button'

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

  const inv = invoice as Invoice & {
    cp_clients: { name: string; email: string; company: string | null; phone: string | null } | null
    currency?: string
    escrow_enabled?: boolean
    escrow_status?: string
    advance_percentage?: number
    advance_payment_link?: string | null
    balance_payment_link?: string | null
    delivered_at?: string | null
    confirmed_at?: string | null
  }
  const currencySymbol = inv.currency === 'USD' ? '$' : '₦'

  const escrowStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    none: { label: 'Not started', color: 'text-zinc-400 bg-zinc-800 border-zinc-700', icon: <Shield className="h-3 w-3" /> },
    awaiting_advance: { label: 'Awaiting advance payment', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: <Clock className="h-3 w-3" /> },
    advance_paid: { label: 'Advance paid', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
    delivered: { label: 'Delivered — awaiting confirmation', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: <Truck className="h-3 w-3" /> },
    confirmed: { label: 'Confirmed — balance due', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
    completed: { label: 'Completed — fully paid', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
    disputed: { label: 'Disputed', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: <AlertTriangle className="h-3 w-3" /> },
  }

  const escrowStatus = inv.escrow_status || 'none'
  const escrowCfg = escrowStatusConfig[escrowStatus] ?? escrowStatusConfig['none']
  const advancePct = inv.advance_percentage ?? 70
  const balancePct = 100 - advancePct

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
          {inv.paystack_payment_link && (
            <ShareInvoiceButton
              invoiceId={inv.id}
              invoiceNumber={inv.invoice_number}
              clientName={inv.cp_clients?.name || 'Client'}
              clientPhone={inv.cp_clients?.phone}
              total={inv.total}
              currency={inv.currency || 'NGN'}
              paymentLink={inv.paystack_payment_link}
            />
          )}
          {inv.status === 'sent' && !inv.advance_requested && <RequestAdvanceButton invoice={inv} />}
          {inv.advance_requested && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg font-medium">
              <Zap className="h-3.5 w-3.5" />
              Advance requested
            </div>
          )}
          {inv.escrow_enabled && escrowStatus === 'advance_paid' && (
            <DeliverButton invoiceId={inv.id} />
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

      {/* Escrow status banner */}
      {inv.escrow_enabled && (
        <div className="bg-zinc-900 border border-white/[0.07] rounded-xl px-5 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Shield className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Protected Payment</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {advancePct}% advance · {balancePct}% on delivery confirmation
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${escrowCfg.color}`}>
              {escrowCfg.icon}
              {escrowCfg.label}
            </div>
          </div>

          {/* Payment links for escrow stages */}
          {(inv.advance_payment_link || inv.balance_payment_link) && (
            <div className="mt-4 pt-4 border-t border-white/[0.05] grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inv.advance_payment_link && (
                <div>
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Advance link ({advancePct}%)</p>
                  <a
                    href={inv.advance_payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 truncate"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{inv.advance_payment_link}</span>
                  </a>
                </div>
              )}
              {inv.balance_payment_link && (
                <div>
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Balance link ({balancePct}%)</p>
                  <a
                    href={inv.balance_payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 truncate"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{inv.balance_payment_link}</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Contract download */}
          <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between">
            <p className="text-xs text-zinc-500">Auto-generated service contract</p>
            <a
              href={`/api/invoices/${inv.id}/contract`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Download contract PDF
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
