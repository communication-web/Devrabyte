import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CheckCircle, Wallet } from 'lucide-react'
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
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Wallet className="h-5 w-5 text-violet-600" />
          <span className="font-bold text-gray-900">CreatorPay</span>
          <span className="text-gray-300 mx-2">|</span>
          <span className="text-gray-500 text-sm">Invoice from {creatorName}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {isPaid ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-center gap-4 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900">This invoice has been paid</p>
              <p className="text-green-700 text-sm mt-0.5">Thank you for your payment!</p>
            </div>
          </div>
        ) : null}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{inv.invoice_number}</p>
                <p className="text-gray-500 text-sm mt-1">From {creatorName}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(inv.total)}</p>
                <p className="text-gray-400 text-sm mt-1">Due {formatDate(inv.due_date)}</p>
              </div>
            </div>
          </div>

          {inv.cp_clients && (
            <div className="px-8 py-5 border-b border-gray-100">
              <p className="text-xs text-gray-400 uppercase font-medium mb-2">Bill to</p>
              <p className="font-medium text-gray-900">{inv.cp_clients.name}</p>
              {inv.cp_clients.company && <p className="text-gray-500 text-sm">{inv.cp_clients.company}</p>}
              <p className="text-gray-500 text-sm">{inv.cp_clients.email}</p>
            </div>
          )}

          <div className="px-8 py-5">
            <div className="grid grid-cols-[1fr_60px_100px_100px] gap-4 text-xs font-medium text-gray-400 uppercase mb-4">
              <span>Description</span>
              <span>Qty</span>
              <span>Unit price</span>
              <span className="text-right">Amount</span>
            </div>
            <div className="space-y-3">
              {(inv.line_items as LineItem[]).map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_100px_100px] gap-4 text-sm">
                  <span className="text-gray-900">{item.description}</span>
                  <span className="text-gray-500">{item.quantity}</span>
                  <span className="text-gray-500">{formatCurrency(item.unit_price)}</span>
                  <span className="text-right font-medium">{formatCurrency(item.quantity * item.unit_price)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-6 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(inv.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Processing fee (1.5%)</span>
                <span>{formatCurrency(inv.platform_fee)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-lg pt-1">
                <span>Total</span>
                <span>{formatCurrency(inv.total)}</span>
              </div>
            </div>
          </div>

          {!isPaid && inv.paystack_payment_link && (
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
              <a
                href={inv.paystack_payment_link}
                className="block w-full text-center bg-violet-600 text-white py-4 rounded-xl font-semibold text-base hover:bg-violet-700 transition-colors"
              >
                Pay {formatCurrency(inv.total)}
              </a>
              <p className="text-xs text-gray-400 text-center mt-3">
                Secured by Paystack · Card, bank transfer, or USSD
              </p>
            </div>
          )}

          {!isPaid && !inv.paystack_payment_link && (
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
              <p className="text-center text-gray-500 text-sm">Payment link not yet available. Please contact {creatorName}.</p>
            </div>
          )}
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">
          Powered by <span className="font-medium">CreatorPay</span>
        </p>
      </main>
    </div>
  )
}
