'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface InvoiceBranding {
  invoice_brand_color: string
  invoice_default_notes: string
  invoice_default_terms: string
}

function InvoicePreview({ color, notes, terms }: { color: string; notes: string; terms: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-zinc-950 overflow-hidden text-xs">
      <div className="h-2" style={{ backgroundColor: color }} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold text-sm" style={{ color }}>INVOICE</p>
            <p className="text-zinc-500 mt-0.5">#INV-0042</p>
          </div>
          <div className="text-right text-zinc-500">
            <p>Issued: 21 May 2026</p>
            <p>Due: 20 Jun 2026</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <p className="text-zinc-500 uppercase tracking-wide font-medium" style={{ fontSize: '9px' }}>From</p>
            <p className="text-zinc-200 font-medium mt-0.5">Your Studio</p>
            <p className="text-zinc-500">you@studio.com</p>
          </div>
          <div>
            <p className="text-zinc-500 uppercase tracking-wide font-medium" style={{ fontSize: '9px' }}>To</p>
            <p className="text-zinc-200 font-medium mt-0.5">Acme Corp</p>
            <p className="text-zinc-500">client@acme.com</p>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left py-1.5 text-zinc-500 font-medium">Description</th>
              <th className="text-right py-1.5 text-zinc-500 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/[0.04]">
              <td className="py-1.5 text-zinc-300">Brand design package</td>
              <td className="py-1.5 text-right text-zinc-100 font-medium">₦150,000</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-2 font-semibold text-zinc-200">Total</td>
              <td className="pt-2 text-right font-bold" style={{ color }}>₦150,000</td>
            </tr>
          </tfoot>
        </table>

        {notes && (
          <div className="pt-1 border-t border-white/[0.06]">
            <p className="text-zinc-500 uppercase tracking-wide font-medium mb-0.5" style={{ fontSize: '9px' }}>Notes</p>
            <p className="text-zinc-400 leading-relaxed">{notes}</p>
          </div>
        )}

        {terms && (
          <div className="border-t border-white/[0.06] pt-1">
            <p className="text-zinc-500 uppercase tracking-wide font-medium mb-0.5" style={{ fontSize: '9px' }}>Terms</p>
            <p className="text-zinc-400 leading-relaxed">{terms}</p>
          </div>
        )}

        <div className="border-t border-white/[0.06] pt-2 text-center">
          <p className="text-zinc-700" style={{ fontSize: '9px' }}>Powered by CreatorPay</p>
        </div>
      </div>
    </div>
  )
}

export default function InvoiceSettingsPage() {
  const [form, setForm] = useState<InvoiceBranding>({
    invoice_brand_color: '#7c3aed',
    invoice_default_notes: '',
    invoice_default_terms: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then(({ user }) => {
        if (user) {
          setForm({
            invoice_brand_color: user.invoice_brand_color || '#7c3aed',
            invoice_default_notes: user.invoice_default_notes || '',
            invoice_default_terms: user.invoice_default_terms || '',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/invoice-branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) showToast('success', 'Invoice branding saved.')
      else showToast('error', data.error || 'Failed to save branding.')
    } catch {
      showToast('error', 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="p-2 hover:bg-white/[0.06] rounded-lg border border-transparent hover:border-white/[0.07] transition-all">
          <ArrowLeft className="h-4 w-4 text-zinc-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Invoice Branding</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Customize how your invoices look to clients</p>
        </div>
      </div>

      {toast && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium border ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-white">Branding options</h2>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-zinc-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Invoice accent color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.invoice_brand_color}
                      onChange={(e) => setForm((f) => ({ ...f, invoice_brand_color: e.target.value }))}
                      className="h-10 w-16 rounded-lg border border-white/[0.1] cursor-pointer p-0.5 bg-zinc-800"
                    />
                    <span className="text-sm text-zinc-400 font-mono">{form.invoice_brand_color}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-600">
                    Used for headers, totals, and accents on your invoice
                  </p>
                </div>

                <Textarea
                  label="Default notes"
                  rows={3}
                  value={form.invoice_default_notes}
                  onChange={(e) => setForm((f) => ({ ...f, invoice_default_notes: e.target.value }))}
                  placeholder="Thank you for your business!"
                />

                <Textarea
                  label="Default terms"
                  rows={3}
                  value={form.invoice_default_terms}
                  onChange={(e) => setForm((f) => ({ ...f, invoice_default_terms: e.target.value }))}
                  placeholder="Payment due within 30 days of invoice date."
                />
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-400">Live preview</p>
          {loading ? (
            <div className="h-80 bg-zinc-800 rounded-xl animate-pulse" />
          ) : (
            <InvoicePreview
              color={form.invoice_brand_color}
              notes={form.invoice_default_notes}
              terms={form.invoice_default_terms}
            />
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} disabled={loading}>
          Save branding
        </Button>
      </div>
    </div>
  )
}
