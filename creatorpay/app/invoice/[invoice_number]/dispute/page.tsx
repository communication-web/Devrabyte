'use client'

import { useState, useEffect } from 'react'
import { Wallet, AlertTriangle, CheckCircle2, Loader2, Shield, Info, Clock } from 'lucide-react'

const DISPUTE_REASONS = [
  'Work not delivered',
  'Quality issues',
  'Wrong deliverables',
  'Partial delivery',
  'Other',
] as const

type DisputeReason = typeof DISPUTE_REASONS[number]

export default function DisputePage({
  params,
}: {
  params: Promise<{ invoice_number: string }>
}) {
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [creatorName, setCreatorName] = useState<string>('')
  const [loadingInvoice, setLoadingInvoice] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    reason: '' as DisputeReason | '',
    details: '',
  })

  useEffect(() => {
    params.then(({ invoice_number }) => {
      setInvoiceNumber(invoice_number)
      fetch(`/api/invoices/public/${invoice_number}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.invoice) {
            setInvoiceId(d.invoice.id)
            setCreatorName(
              d.invoice.cp_users?.business_name ||
              d.invoice.cp_users?.full_name ||
              'the Creator'
            )
          }
          setLoadingInvoice(false)
        })
        .catch(() => setLoadingInvoice(false))
    })
  }, [params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invoiceId) {
      setError('Invoice not found. Please check your link.')
      return
    }
    if (!form.reason || !form.client_name || !form.client_email) {
      setError('Please fill in all required fields.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: form.reason,
          details: form.details,
          client_email: form.client_email,
          client_name: form.client_name,
          raised_by: 'client',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit dispute')
        return
      }

      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090f]">
      <header className="bg-[#0c0c14] border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2.5">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm shadow-violet-900/50">
            <Wallet className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-white text-sm font-display">CreatorPay</span>
          <span className="text-zinc-700 mx-1">·</span>
          <span className="text-zinc-500 text-sm">Raise a Dispute</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {submitted ? (
          <div className="space-y-5">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-emerald-300">Dispute submitted successfully</p>
                <p className="text-emerald-400/80 text-sm mt-1">
                  Your dispute has been received. Our team will review it within 5 business days.
                </p>
              </div>
            </div>

            {/* Resolution timeline */}
            <div className="bg-zinc-900 rounded-2xl border border-white/[0.07] p-6">
              <p className="text-sm font-semibold text-white mb-4">What happens next</p>
              <div className="space-y-4">
                {[
                  {
                    step: '1',
                    label: 'Review (1–2 business days)',
                    desc: 'Our team will review your dispute and contact both parties.',
                    active: true,
                  },
                  {
                    step: '2',
                    label: 'Evidence collection (up to 3 business days)',
                    desc: 'We may request supporting evidence from you and the Creator.',
                    active: false,
                  },
                  {
                    step: '3',
                    label: 'Resolution (within 5 business days)',
                    desc: 'A decision will be made regarding the escrow funds.',
                    active: false,
                  },
                  {
                    step: '4',
                    label: 'Escalation (if needed)',
                    desc: 'Unresolved disputes may be escalated to the Consumer Protection Council of Nigeria.',
                    active: false,
                  },
                ].map((s) => (
                  <div key={s.step} className="flex gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${s.active ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                      {s.step}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${s.active ? 'text-white' : 'text-zinc-500'}`}>{s.label}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Warning banner */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300 text-sm">Raising a dispute will pause payment</p>
                <p className="text-amber-400/80 text-xs mt-1">
                  Once submitted, the escrow funds will be held pending review by CreatorPay. This process takes up to 5 business days.
                </p>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl border border-white/[0.07] overflow-hidden">
              <div className="h-1 bg-amber-500" />
              <div className="px-8 py-7">
                <div className="flex items-center gap-2.5 mb-6">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <div>
                    <p className="font-semibold text-white text-sm">Dispute for invoice {invoiceNumber}</p>
                    {creatorName && (
                      <p className="text-xs text-zinc-500 mt-0.5">Against: {creatorName}</p>
                    )}
                  </div>
                </div>

                {loadingInvoice ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Client info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                          Your name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={form.client_name}
                          onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
                          placeholder="Full name"
                          className="w-full rounded-lg border border-white/[0.1] px-3 py-2.5 text-sm bg-zinc-800/60 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                          Your email <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={form.client_email}
                          onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value }))}
                          placeholder="email@example.com"
                          className="w-full rounded-lg border border-white/[0.1] px-3 py-2.5 text-sm bg-zinc-800/60 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Reason */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Reason for dispute <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {DISPUTE_REASONS.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, reason: r }))}
                            className={`text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                              form.reason === r
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-medium'
                                : 'bg-zinc-800/60 border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.15]'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Details */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Additional details
                      </label>
                      <textarea
                        value={form.details}
                        onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                        rows={4}
                        placeholder="Describe the issue in detail. The more specific you are, the faster we can resolve this."
                        className="w-full rounded-lg border border-white/[0.1] px-3 py-2.5 text-sm bg-zinc-800/60 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500 transition-colors resize-none"
                      />
                    </div>

                    {/* Consumer protection notice */}
                    <div className="bg-zinc-800/60 border border-white/[0.05] rounded-lg px-4 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-zinc-500" />
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Consumer protection notice</p>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        CreatorPay's dispute process is governed by the <strong className="text-zinc-400">Consumer Protection Council Act Cap C25 LFN 2004</strong> and the <strong className="text-zinc-400">Arbitration and Conciliation Act Cap A18 LFN 2004</strong>. Unresolved disputes may be escalated to the Consumer Protection Council of Nigeria. Submitting a false or misleading dispute may result in account suspension.
                      </p>
                    </div>

                    {/* Timeline */}
                    <div className="bg-zinc-800/40 border border-white/[0.05] rounded-lg px-4 py-3 flex items-center gap-3">
                      <Clock className="h-4 w-4 text-zinc-500 shrink-0" />
                      <p className="text-xs text-zinc-500">
                        Disputes are reviewed within <strong className="text-zinc-400">5 business days</strong>. Both parties will be contacted via email.
                      </p>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !form.reason}
                      className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-sm shadow-amber-900/30"
                    >
                      {submitting ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                      ) : (
                        <><AlertTriangle className="h-4 w-4" /> Submit dispute</>
                      )}
                    </button>

                    <p className="text-center text-xs text-zinc-600">
                      Changed your mind?{' '}
                      <a href={`/invoice/${invoiceNumber}`} className="text-violet-400 hover:text-violet-300 underline">
                        Go back to invoice
                      </a>
                    </p>
                  </form>
                )}
              </div>
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
