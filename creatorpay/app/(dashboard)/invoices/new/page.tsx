'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { formatCurrency, PLATFORM_FEE_RATE } from '@/lib/utils'
import { Client, LineItem } from '@/types'
import Link from 'next/link'

export default function NewInvoicePage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN')
  const [form, setForm] = useState({
    client_id: '',
    due_date: '',
    new_client_name: '',
    new_client_email: '',
    new_client_company: '',
    new_client_phone: '',
  })
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0 },
  ])

  useEffect(() => {
    fetch('/api/clients').then((r) => r.json()).then((d) => setClients(d.clients || []))
  }, [])

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const platformFee = subtotal * PLATFORM_FEE_RATE
  const total = subtotal + platformFee
  const currencySymbol = currency === 'USD' ? '$' : '₦'

  function addLineItem() {
    setLineItems((prev) => [...prev, { description: '', quantity: 1, unit_price: 0 }])
  }

  function removeLineItem(i: number) {
    setLineItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateLineItem(i: number, key: keyof LineItem, value: string | number) {
    setLineItems((prev) =>
      prev.map((item, idx) =>
        idx === i ? { ...item, [key]: key === 'description' ? value : Number(value) } : item
      )
    )
  }

  async function handleSubmit(e: React.FormEvent, action: 'draft' | 'send') {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        client_id: showNewClient ? null : form.client_id || null,
        new_client: showNewClient ? {
          name: form.new_client_name,
          email: form.new_client_email,
          company: form.new_client_company,
          phone: form.new_client_phone,
        } : null,
        due_date: form.due_date,
        line_items: lineItems,
        currency,
        action,
      }

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create invoice')
        return
      }

      router.push(`/invoices/${data.invoice.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/invoices" className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors border border-transparent hover:border-white/[0.07]">
          <ArrowLeft className="h-4 w-4 text-zinc-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">New Invoice</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Fill in the details below</p>
        </div>
      </div>

      {/* Client section */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-sm font-semibold text-white">Client</h2>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1 w-fit">
            <button
              type="button"
              onClick={() => setShowNewClient(false)}
              className={`text-sm font-medium px-3 py-1.5 rounded-md transition-all ${!showNewClient ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Existing client
            </button>
            <button
              type="button"
              onClick={() => setShowNewClient(true)}
              className={`text-sm font-medium px-3 py-1.5 rounded-md transition-all ${showNewClient ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              New client
            </button>
          </div>

          {!showNewClient ? (
            <Select
              label="Select client"
              value={form.client_id}
              onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
            >
              <option value="">Choose a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
              ))}
            </Select>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Name" value={form.new_client_name} onChange={(e) => setForm((f) => ({ ...f, new_client_name: e.target.value }))} required />
              <Input label="Email" type="email" value={form.new_client_email} onChange={(e) => setForm((f) => ({ ...f, new_client_email: e.target.value }))} required />
              <Input label="Company (optional)" value={form.new_client_company} onChange={(e) => setForm((f) => ({ ...f, new_client_company: e.target.value }))} />
              <Input label="Phone (optional)" value={form.new_client_phone} onChange={(e) => setForm((f) => ({ ...f, new_client_phone: e.target.value }))} />
            </div>
          )}
        </div>
      </div>

      {/* Currency */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-sm font-semibold text-white">Currency</h2>
        </div>
        <div className="px-5 py-5">
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1 w-fit">
            {(['NGN', 'USD'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`text-sm font-medium px-4 py-1.5 rounded-md transition-all ${currency === c ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {c === 'NGN' ? '₦ Naira' : '$ USD'}
              </button>
            ))}
          </div>
          {currency === 'USD' && (
            <p className="mt-3 text-xs text-zinc-500">Your client will be charged in US Dollars via Paystack.</p>
          )}
        </div>
      </div>

      {/* Line items */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-sm font-semibold text-white">Line Items</h2>
          <button
            type="button"
            onClick={addLineItem}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add item
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-[1fr_72px_116px_36px] gap-3">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Description</span>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Qty</span>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Unit price ({currencySymbol})</span>
            <span />
          </div>
          {lineItems.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_72px_116px_36px] gap-3 items-center">
              <input
                className="rounded-lg border border-white/[0.1] px-3 py-2 text-sm bg-zinc-800/60 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
                placeholder="e.g. Logo design"
                value={item.description}
                onChange={(e) => updateLineItem(i, 'description', e.target.value)}
              />
              <input
                type="number"
                min={1}
                className="rounded-lg border border-white/[0.1] px-3 py-2 text-sm bg-zinc-800/60 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
                value={item.quantity}
                onChange={(e) => updateLineItem(i, 'quantity', e.target.value)}
              />
              <input
                type="number"
                min={0}
                className="rounded-lg border border-white/[0.1] px-3 py-2 text-sm bg-zinc-800/60 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
                value={item.unit_price}
                onChange={(e) => updateLineItem(i, 'unit_price', e.target.value)}
              />
              <button
                onClick={() => removeLineItem(i)}
                disabled={lineItems.length === 1}
                className="p-2 text-zinc-600 hover:text-red-400 disabled:opacity-30 transition-colors rounded-lg hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <div className="border-t border-white/[0.05] pt-4 mt-4 space-y-2">
            <div className="flex justify-between text-sm text-zinc-400">
              <span>Subtotal</span><span>{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-500">
              <span>Platform fee (1.5%)</span><span>{currencySymbol}{platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-white/[0.05]">
              <span>Total</span><span>{currencySymbol}{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Due date */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-sm font-semibold text-white">Details</h2>
        </div>
        <div className="px-5 py-5">
          <Input
            label="Due date"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
            required
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'draft')}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/[0.1] bg-zinc-800 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          Save as draft
        </button>
        <Button
          onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'send')}
          loading={loading}
        >
          Send invoice
        </Button>
      </div>
    </div>
  )
}
