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

function InvoicePreview({
  color,
  notes,
  terms,
}: {
  color: string
  notes: string
  terms: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm text-xs">
      <div className="h-2" style={{ backgroundColor: color }} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold text-gray-900 text-sm" style={{ color }}>INVOICE</p>
            <p className="text-gray-400 mt-0.5">#INV-0042</p>
          </div>
          <div className="text-right text-gray-500">
            <p>Issued: 21 May 2026</p>
            <p>Due: 20 Jun 2026</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <p className="text-gray-400 uppercase tracking-wide font-medium" style={{ fontSize: '9px' }}>From</p>
            <p className="text-gray-900 font-medium mt-0.5">Your Studio</p>
            <p className="text-gray-500">you@studio.com</p>
          </div>
          <div>
            <p className="text-gray-400 uppercase tracking-wide font-medium" style={{ fontSize: '9px' }}>To</p>
            <p className="text-gray-900 font-medium mt-0.5">Acme Corp</p>
            <p className="text-gray-500">client@acme.com</p>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-1.5 text-gray-500 font-medium">Description</th>
              <th className="text-right py-1.5 text-gray-500 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-50">
              <td className="py-1.5 text-gray-700">Brand design package</td>
              <td className="py-1.5 text-right text-gray-900 font-medium">₦150,000</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-2 font-semibold text-gray-900">Total</td>
              <td className="pt-2 text-right font-bold" style={{ color }}>₦150,000</td>
            </tr>
          </tfoot>
        </table>

        {notes && (
          <div className="pt-1 border-t border-gray-100">
            <p className="text-gray-400 uppercase tracking-wide font-medium mb-0.5" style={{ fontSize: '9px' }}>Notes</p>
            <p className="text-gray-600 leading-relaxed">{notes}</p>
          </div>
        )}

        {terms && (
          <div className="border-t border-gray-100 pt-1">
            <p className="text-gray-400 uppercase tracking-wide font-medium mb-0.5" style={{ fontSize: '9px' }}>Terms</p>
            <p className="text-gray-600 leading-relaxed">{terms}</p>
          </div>
        )}

        <div className="border-t border-gray-100 pt-2 text-center">
          <p className="text-gray-300" style={{ fontSize: '9px' }}>Powered by CreatorPay</p>
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
      if (data.success) {
        showToast('success', 'Invoice branding saved.')
      } else {
        showToast('error', data.error || 'Failed to save branding.')
      }
    } catch {
      showToast('error', 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Branding</h1>
          <p className="text-gray-500 text-sm mt-0.5">Customize how your invoices look to clients</p>
        </div>
      </div>

      {toast && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Branding options</h2>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice accent color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.invoice_brand_color}
                      onChange={(e) => setForm((f) => ({ ...f, invoice_brand_color: e.target.value }))}
                      className="h-10 w-16 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white"
                    />
                    <span className="text-sm text-gray-500 font-mono">{form.invoice_brand_color}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">
                    Used for headers, totals, and accents on your invoice
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Default notes
                  </label>
                  <Textarea
                    rows={3}
                    value={form.invoice_default_notes}
                    onChange={(e) => setForm((f) => ({ ...f, invoice_default_notes: e.target.value }))}
                    placeholder="Thank you for your business!"
                  />
                  <p className="mt-1.5 text-xs text-gray-400">
                    Appears on every invoice below the line items
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Default terms
                  </label>
                  <Textarea
                    rows={3}
                    value={form.invoice_default_terms}
                    onChange={(e) => setForm((f) => ({ ...f, invoice_default_terms: e.target.value }))}
                    placeholder="Payment due within 30 days of invoice date."
                  />
                  <p className="mt-1.5 text-xs text-gray-400">
                    Payment terms shown at the bottom of every invoice
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Live preview</p>
          {loading ? (
            <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
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
