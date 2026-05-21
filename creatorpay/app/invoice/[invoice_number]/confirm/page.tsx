'use client'

import { useState, useEffect } from 'react'
import { Wallet, CheckCircle2, AlertCircle, Loader2, Shield, ExternalLink } from 'lucide-react'

export default function ConfirmDeliveryPage({
  params,
}: {
  params: Promise<{ invoice_number: string }>
}) {
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const [invoice, setInvoice] = useState<{
    id: string
    invoice_number: string
    total: number
    advance_percentage: number
    cp_users: { business_name?: string; full_name?: string } | null
    cp_clients: { name?: string } | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [balanceLink, setBalanceLink] = useState<string | null>(null)
  const [balanceAmount, setBalanceAmount] = useState<number>(0)
  const [error, setError] = useState('')

  useEffect(() => {
    params.then(({ invoice_number }) => {
      setInvoiceNumber(invoice_number)
      fetch(`/api/invoices/public/${invoice_number}`)
        .then((r) => r.json())
        .then((d) => {
          setInvoice(d.invoice || null)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    })
  }, [params])

  async function handleConfirm() {
    if (!invoice) return
    setConfirming(true)
    setError('')

    try {
      const res = await fetch(`/api/invoices/${invoice.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_number: invoiceNumber }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to confirm delivery')
        return
      }

      setConfirmed(true)
      setBalanceLink(data.balance_payment_link || null)
      setBalanceAmount(data.balance_amount || 0)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  const creatorName =
    invoice?.cp_users?.business_name || invoice?.cp_users?.full_name || 'Creator'
  const advancePct = invoice?.advance_percentage ?? 70
  const balancePct = 100 - advancePct
  const computedBalance = invoice ? Math.round(invoice.total * balancePct / 100) : 0

  return (
    <div className="min-h-screen bg-[#09090f]">
      <header className="bg-[#0c0c14] border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2.5">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm shadow-violet-900/50">
            <Wallet className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-white text-sm font-display">CreatorPay</span>
          <span className="text-zinc-700 mx-1">·</span>
          <span className="text-zinc-500 text-sm">Confirm Delivery</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : !invoice ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
            <p className="font-semibold text-red-300">Invoice not found</p>
            <p className="text-red-400/80 text-sm mt-1">
              We could not find invoice {invoiceNumber}. Please check the link and try again.
            </p>
          </div>
        ) : confirmed ? (
          <div className="space-y-5">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-emerald-300">Delivery confirmed!</p>
                <p className="text-emerald-400/80 text-sm mt-1">
                  You have confirmed that the service was delivered. Thank you for using CreatorPay.
                </p>
              </div>
            </div>

            {(balanceLink || computedBalance > 0) && (
              <div className="bg-zinc-900 rounded-2xl border border-white/[0.07] p-6 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-white">Remaining balance due</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    ₦{(balanceAmount || computedBalance).toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">
                    {balancePct}% balance payment to {creatorName}
                  </p>
                </div>

                {balanceLink ? (
                  <a
                    href={balanceLink}
                    className="block w-full text-center bg-emerald-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-emerald-500 transition-colors shadow-sm shadow-emerald-900/30"
                  >
                    Pay remaining balance
                  </a>
                ) : (
                  <p className="text-sm text-zinc-500 text-center">
                    The creator will send you a balance payment link shortly.
                  </p>
                )}

                <div className="flex items-center justify-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-zinc-500" />
                  <p className="text-xs text-zinc-500">Secured by Paystack · Card, bank transfer, or USSD</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="h-1 bg-violet-600" />
            <div className="px-8 py-7">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Protected Payment — Delivery Confirmation</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Invoice {invoiceNumber} · {creatorName}</p>
                </div>
              </div>

              <div className="bg-zinc-800/60 border border-white/[0.05] rounded-xl p-5 mb-6">
                <p className="text-sm font-medium text-zinc-200 mb-2">Please confirm that:</p>
                <ul className="space-y-2">
                  {[
                    'You have received the service described in this invoice',
                    'The work meets the agreed specifications and quality standards',
                    'You are satisfied and ready to proceed with the balance payment',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-400">
                      <CheckCircle2 className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-zinc-800/40 border border-white/[0.05] rounded-lg px-4 py-3 mb-5 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Total invoice</span>
                  <span className="font-semibold text-white">
                    ₦{invoice.total.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Already paid ({advancePct}%)</span>
                  <span className="text-zinc-300">
                    ₦{Math.round(invoice.total * advancePct / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-white/[0.05] pt-1.5 mt-0.5">
                  <span className="text-zinc-400">Balance due ({balancePct}%)</span>
                  <span className="font-bold text-emerald-400">
                    ₦{computedBalance.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400 mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-sm shadow-emerald-900/30"
              >
                {confirming ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Confirming…</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> Confirm delivery & proceed to pay balance</>
                )}
              </button>

              <p className="text-center text-xs text-zinc-600 mt-4">
                If you have concerns about the delivery,{' '}
                <a href={`/invoice/${invoiceNumber}/dispute`} className="text-amber-400 hover:text-amber-300 underline">
                  raise a dispute instead
                </a>
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-zinc-600 text-xs mt-8">
          Powered by <span className="font-semibold text-zinc-500">CreatorPay</span>
        </p>
      </main>
    </div>
  )
}
