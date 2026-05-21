'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface InvoiceBranding {
  invoice_brand_color: string
  invoice_default_notes: string
  invoice_default_terms: string
  invoice_logo_url: string | null
}

function InvoicePreview({
  color,
  notes,
  terms,
  logoUrl,
}: {
  color: string
  notes: string
  terms: string
  logoUrl: string | null
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-zinc-950 overflow-hidden text-xs">
      <div className="h-2" style={{ backgroundColor: color }} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 max-w-[100px] object-contain mb-1" />
            ) : (
              <p className="font-bold text-sm" style={{ color }}>INVOICE</p>
            )}
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
    invoice_logo_url: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then(({ user }) => {
        if (user) {
          setForm({
            invoice_brand_color: user.invoice_brand_color || '#7c3aed',
            invoice_default_notes: user.invoice_default_notes || '',
            invoice_default_terms: user.invoice_default_terms || '',
            invoice_logo_url: user.invoice_logo_url || null,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }

  async function uploadLogo(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/settings/invoice-logo', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setForm((f) => ({ ...f, invoice_logo_url: data.url }))
        showToast('success', 'Logo uploaded.')
      } else {
        showToast('error', data.error || 'Upload failed.')
      }
    } catch {
      showToast('error', 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function removeLogo() {
    setUploading(true)
    try {
      await fetch('/api/settings/invoice-logo', { method: 'DELETE' })
      setForm((f) => ({ ...f, invoice_logo_url: null }))
      showToast('success', 'Logo removed.')
    } catch {
      showToast('error', 'Could not remove logo.')
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadLogo(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadLogo(file)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/invoice-branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_brand_color: form.invoice_brand_color,
          invoice_default_notes: form.invoice_default_notes,
          invoice_default_terms: form.invoice_default_terms,
        }),
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
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-zinc-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* Logo upload */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Business logo
                  </label>

                  {form.invoice_logo_url ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.07] bg-zinc-800/40">
                      <img
                        src={form.invoice_logo_url}
                        alt="Logo"
                        className="h-10 max-w-[120px] object-contain rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-400 truncate">Logo uploaded</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">Shown on all invoices</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors disabled:opacity-50"
                        >
                          Replace
                        </button>
                        <button
                          onClick={removeLogo}
                          disabled={uploading}
                          className="text-xs text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      className={`flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                        dragOver
                          ? 'border-violet-500/60 bg-violet-500/5'
                          : 'border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.02]'
                      } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                    >
                      {uploading ? (
                        <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-zinc-500" />
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-xs font-semibold text-zinc-400">
                          {uploading ? 'Uploading…' : 'Drop image or click to upload'}
                        </p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">PNG, JPG, WebP, SVG · max 2 MB</p>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Accent color */}
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
              logoUrl={form.invoice_logo_url}
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
