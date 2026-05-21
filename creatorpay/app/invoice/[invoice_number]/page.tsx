import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CheckCircle, Wallet, Shield } from 'lucide-react'
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
    .select('*, cp_clients(*), cp_users(business_name, full_name)')
    .eq('invoice_number', invoice_number)
    .single()

  if (!invoice) notFound()

  const inv = invoice as Invoice & {
    cp_clients: { name: string; email: string; company: string | null } | null
    cp_users: { business_name: string | null; full_name: string } | null
  }

  const isPaid = inv.status === 'paid'
  const creatorName = inv.cp_users?.business_name || inv.cp_users?.full_name || 'Creator'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2.5">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
            <Wallet className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">CreatorPay</span>
          <span className="text-gray-200 mx-1">·</span>
          <span className="text-gray-400 text-sm">Invoice from {creatorName}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {isPaid && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900 text-sm">Payment received</p>
              <p className="text-emerald-700 text-xs mt-0.5">Thank you — this invoice has been paid in full.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {/* Invoice header */}
          <div className="h-1 bg-violet-600" />
          <div className="px-8 py-7 border-b border-gray-50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Invoice</p>
                <p className="text-xl font-bold text-gray-900">{inv.invoice_number}</p>
                <p className="text-sm text-gray-400 mt-1">From {creatorName}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(inv.total)}</p>
                <p className="text-sm text-gray-400 mt-1">Due {formatDate(inv.due_date)}</p>
              </div>
            </div>
          </div>

          {/* Bill to */}
          {inv.cp_clients && (
            <div className="px-8 py-5 border-b border-gray-50">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill to</p>
              <p className="font-semibold text-gray-900">{inv.cp_clients.name}</p>
              {inv.cp_clients.company && <p className="text-sm text-gray-500 mt-0.5">{inv.cp_clients.company}</p>}
              <p className="text-sm text-gray-500 mt-0.5">{inv.cp_clients.email}</p>
            </div>
          )}

          {/* Line items */}
          <div className="px-8 py-5">
            <div className="grid grid-cols-[1fr_56px_96px_96px] gap-4 mb-3">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Description</span>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Qty</span>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Price</span>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">Amount</span>
            </div>
            <div className="space-y-2.5">
              {(inv.line_items as LineItem[]).map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_56px_96px_96px] gap-4 text-sm">
                  <span className="text-gray-900">{item.description}</span>
                  <span className="text-gray-500">{item.quantity}</span>
                  <span className="text-gray-500">{formatCurrency(item.unit_price)}</span>
                  <span className="text-right font-medium text-gray-900">{formatCurrency(item.quantity * item.unit_price)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-50 mt-5 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span><span>{formatCurrency(inv.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Processing fee (1.5%)</span><span>{formatCurrency(inv.platform_fee)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-lg pt-2 border-t border-gray-100">
                <span>Total</span><span>{formatCurrency(inv.total)}</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          {!isPaid && inv.paystack_payment_link && (
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
              <a
                href={inv.paystack_payment_link}
                className="block w-full text-center bg-violet-600 text-white py-4 rounded-xl font-semibold text-base hover:bg-violet-700 transition-colors"
              >
                Pay {formatCurrency(inv.total)}
              </a>
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <Shield className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-xs text-gray-400">Secured by Paystack · Card, bank transfer, or USSD</p>
              </div>
            </div>
          )}

          {!isPaid && !inv.paystack_payment_link && (
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
              <p className="text-center text-sm text-gray-400">Payment link not yet available. Please contact {creatorName}.</p>
            </div>
          )}
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">
          Powered by <span className="font-semibold">CreatorPay</span>
        </p>
      </main>
    </div>
  )
}
