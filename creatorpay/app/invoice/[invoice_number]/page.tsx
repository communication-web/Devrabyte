import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CheckCircle, Wallet, Shield, Clock, Truck, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Invoice, LineItem } from '@/types'

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ invoice_number: string }>
}) {
  const { invoice_number } = await params
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('cp_invoices')
    .select('*, cp_clients(*), cp_users(business_name, full_name, invoice_logo_url, invoice_brand_color)')
    .eq('invoice_number', invoice_number)
    .single()

  if (!invoice) notFound()

  const inv = invoice as Invoice & {
    cp_clients: { name: string; email: string; company: string | null } | null
    cp_users: { business_name: string | null; full_name: string; invoice_logo_url?: string | null; invoice_brand_color?: string | null } | null
    currency?: string
    escrow_enabled?: boolean
    escrow_status?: string
    advance_percentage?: number
    advance_payment_link?: string | null
    balance_payment_link?: string | null
    delivered_at?: string | null
    confirmed_at?: string | null
  }

  const isPaid = inv.status === 'paid'
  const creatorName = inv.cp_users?.business_name || inv.cp_users?.full_name || 'Creator'
  const logoUrl = inv.cp_users?.invoice_logo_url || null
  const brandColor = inv.cp_users?.invoice_brand_color || '#7c3aed'
  const currency = inv.currency || 'NGN'
  const currencySymbol = currency === 'USD' ? '$' : '₦'

  const isEscrow = inv.escrow_enabled === true
  const escrowStatus = inv.escrow_status || 'none'
  const advancePct = inv.advance_percentage ?? 70
  const balancePct = 100 - advancePct
  const advanceAmount = Math.round((inv.total ?? 0) * advancePct / 100)
  const balanceAmount = (inv.total ?? 0) - advanceAmount

  return (
    <div className="min-h-screen bg-[#09090f]">
      {/* Header */}
      <header className="bg-[#0c0c14] border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2.5">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm shadow-violet-900/50">
            <Wallet className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-white text-sm font-display">CreatorPay</span>
          <span className="text-zinc-700 mx-1">·</span>
          <span className="text-zinc-500 text-sm">Invoice from {creatorName}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Paid banner */}
        {isPaid && escrowStatus === 'completed' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-emerald-300 text-sm">Fully paid</p>
              <p className="text-emerald-400/80 text-xs mt-0.5">Both advance and balance payments have been received. Thank you!</p>
            </div>
          </div>
        )}

        {isPaid && !isEscrow && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-emerald-300 text-sm">Payment received</p>
              <p className="text-emerald-400/80 text-xs mt-0.5">Thank you — this invoice has been paid in full.</p>
            </div>
          </div>
        )}

        {/* Escrow status banners */}
        {isEscrow && escrowStatus === 'advance_paid' && (
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5 flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-violet-300 text-sm">Advance paid — awaiting delivery</p>
              <p className="text-violet-400/80 text-xs mt-0.5">
                {creatorName} has received your {advancePct}% advance payment and is working on your project.
              </p>
            </div>
          </div>
        )}

        {isEscrow && escrowStatus === 'disputed' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-red-300 text-sm">Dispute in progress</p>
              <p className="text-red-400/80 text-xs mt-0.5">
                A dispute has been raised on this invoice. Our team will resolve it within 5 business days.
              </p>
            </div>
          </div>
        )}

        <div className="bg-zinc-900 rounded-2xl border border-white/[0.07] overflow-hidden">
          {/* Invoice header */}
          <div className="h-1" style={{ backgroundColor: brandColor }} />
          <div className="px-8 py-7 border-b border-white/[0.05]">
            <div className="flex items-start justify-between gap-4">
              <div>
                {logoUrl ? (
                  <img src={logoUrl} alt={creatorName} className="h-10 max-w-[140px] object-contain mb-2" />
                ) : (
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Invoice</p>
                )}
                <p className="text-xl font-bold text-white">{inv.invoice_number}</p>
                <p className="text-sm text-zinc-500 mt-1">From {creatorName}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{formatCurrency(inv.total)}</p>
                <p className="text-sm text-zinc-500 mt-1">Due {formatDate(inv.due_date)}</p>
                {currency !== 'NGN' && (
                  <p className="text-xs text-zinc-600 mt-0.5">Currency: {currency}</p>
                )}
                {isEscrow && (
                  <div className="flex items-center justify-end gap-1 mt-2">
                    <Shield className="h-3 w-3 text-violet-400" />
                    <span className="text-xs text-violet-400 font-medium">Protected Payment</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bill to */}
          {inv.cp_clients && (
            <div className="px-8 py-5 border-b border-white/[0.05]">
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Bill to</p>
              <p className="font-semibold text-white">{inv.cp_clients.name}</p>
              {inv.cp_clients.company && <p className="text-sm text-zinc-400 mt-0.5">{inv.cp_clients.company}</p>}
              <p className="text-sm text-zinc-400 mt-0.5">{inv.cp_clients.email}</p>
            </div>
          )}

          {/* Line items */}
          <div className="px-8 py-5">
            <div className="grid grid-cols-[1fr_56px_96px_96px] gap-4 mb-3">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Description</span>
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Qty</span>
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Price</span>
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Amount</span>
            </div>
            <div className="space-y-2.5">
              {(inv.line_items as LineItem[]).map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_56px_96px_96px] gap-4 text-sm">
                  <span className="text-zinc-100">{item.description}</span>
                  <span className="text-zinc-400">{item.quantity}</span>
                  <span className="text-zinc-400">{currencySymbol}{item.unit_price.toLocaleString()}</span>
                  <span className="text-right font-medium text-white">{currencySymbol}{(item.quantity * item.unit_price).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/[0.05] mt-5 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Subtotal</span><span>{formatCurrency(inv.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Processing fee (1.5%)</span><span>{formatCurrency(inv.platform_fee)}</span>
              </div>
              <div className="flex justify-between font-bold text-white text-lg pt-2 border-t border-white/[0.05]">
                <span>Total</span><span>{formatCurrency(inv.total)}</span>
              </div>
            </div>
          </div>

          {/* CTA section */}
          <div className="px-8 py-6 bg-zinc-800/40 border-t border-white/[0.05]">

            {/* ── Non-escrow invoice ── */}
            {!isEscrow && !isPaid && inv.paystack_payment_link && (
              <>
                <a
                  href={inv.paystack_payment_link}
                  className="block w-full text-center bg-violet-600 text-white py-4 rounded-xl font-semibold text-base hover:bg-violet-500 transition-colors shadow-sm shadow-violet-900/40"
                >
                  Pay {formatCurrency(inv.total)}
                </a>
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <Shield className="h-3.5 w-3.5 text-zinc-500" />
                  <p className="text-xs text-zinc-500">Secured by Paystack · Card, bank transfer, or USSD</p>
                </div>
              </>
            )}

            {!isEscrow && !isPaid && !inv.paystack_payment_link && (
              <p className="text-center text-sm text-zinc-500">Payment link not yet available. Please contact {creatorName}.</p>
            )}

            {/* ── Escrow: awaiting advance ── */}
            {isEscrow && (escrowStatus === 'none' || escrowStatus === 'awaiting_advance') && inv.advance_payment_link && (
              <div className="space-y-4">
                {/* Contract agreement */}
                <div className="bg-zinc-800/60 border border-white/[0.07] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">Service Contract</p>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        By paying, you agree to a legally binding service contract. This protects both you and {creatorName}. The contract is governed by Nigerian law.
                      </p>
                      <a
                        href={`/api/invoices/${inv.id}/contract`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 mt-2 underline underline-offset-2"
                      >
                        View contract PDF
                      </a>
                    </div>
                  </div>
                </div>

                {/* Payment breakdown */}
                <div className="bg-zinc-800/40 border border-white/[0.05] rounded-lg px-4 py-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Advance ({advancePct}%) — pay now</span>
                    <span className="font-bold text-white">{currencySymbol}{advanceAmount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Balance ({balancePct}%) — after delivery</span>
                    <span className="text-zinc-400">{currencySymbol}{balanceAmount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                <a
                  href={inv.advance_payment_link}
                  className="block w-full text-center bg-violet-600 text-white py-4 rounded-xl font-semibold text-base hover:bg-violet-500 transition-colors shadow-sm shadow-violet-900/40"
                >
                  Pay {advancePct}% Advance — {currencySymbol}{advanceAmount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                </a>

                <p className="text-xs text-zinc-500 text-center">
                  Remaining {balancePct}% ({currencySymbol}{balanceAmount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}) is due when you confirm delivery
                </p>

                <div className="flex items-center justify-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-zinc-500" />
                  <p className="text-xs text-zinc-500">Secured by Paystack · Card, bank transfer, or USSD</p>
                </div>
              </div>
            )}

            {/* ── Escrow: delivered — awaiting confirmation ── */}
            {isEscrow && escrowStatus === 'delivered' && (
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                  <Truck className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-300">Delivery submitted</p>
                    <p className="text-xs text-blue-400/80 mt-1">
                      {creatorName} has marked this project as delivered. Please review and confirm or raise a dispute.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`/invoice/${invoice_number}/confirm`}
                    className="block text-center bg-emerald-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-emerald-500 transition-colors shadow-sm shadow-emerald-900/30"
                  >
                    Confirm delivery
                  </a>
                  <a
                    href={`/invoice/${invoice_number}/dispute`}
                    className="block text-center bg-zinc-800 border border-amber-500/30 text-amber-300 py-3.5 rounded-xl font-semibold text-sm hover:bg-amber-500/10 transition-colors"
                  >
                    Raise a dispute
                  </a>
                </div>
                <p className="text-xs text-zinc-600 text-center">
                  Confirming will release the balance payment request
                </p>
              </div>
            )}

            {/* ── Escrow: confirmed — balance due ── */}
            {isEscrow && escrowStatus === 'confirmed' && inv.balance_payment_link && (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">Delivery confirmed!</p>
                    <p className="text-xs text-emerald-400/80 mt-1">
                      Please pay the remaining {balancePct}% balance to complete the project.
                    </p>
                  </div>
                </div>
                <a
                  href={inv.balance_payment_link}
                  className="block w-full text-center bg-emerald-600 text-white py-4 rounded-xl font-semibold text-base hover:bg-emerald-500 transition-colors shadow-sm shadow-emerald-900/30"
                >
                  Pay {balancePct}% Balance — {currencySymbol}{balanceAmount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                </a>
                <div className="flex items-center justify-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-zinc-500" />
                  <p className="text-xs text-zinc-500">Secured by Paystack · Card, bank transfer, or USSD</p>
                </div>
              </div>
            )}

            {/* ── Escrow: completed ── */}
            {isEscrow && escrowStatus === 'completed' && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-300">Fully paid</p>
                  <p className="text-xs text-emerald-400/80 mt-0.5">Both advance and balance payments are complete.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-8">
          Powered by <span className="font-semibold text-zinc-500">CreatorPay</span>
        </p>
      </main>
    </div>
  )
}
