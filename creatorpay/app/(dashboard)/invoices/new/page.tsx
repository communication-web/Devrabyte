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
        <Link href="/invoices" className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
          <p className="text-gray-400 text-sm mt-0.5">Fill in the details below</p>
        </div>
      </div>

      {/* Client section */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Client</h2>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 w-fit">
            <button
              type="button"
              onClick={() => setShowNewClient(false)}
              className={`text-sm font-medium px-3 py-1.5 rounded-md transition-all ${!showNewClient ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Existing client
            </button>
            <button
              type="button"
              onClick={() => setShowNewClient(true)}
              className={`text-sm font-medium px-3 py-1.5 rounded-md transition-all ${showNewClient ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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

      {/* Line items */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Line Items</h2>
          <button
            type="button"
            onClick={addLineItem}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add item
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-[1fr_72px_116px_36px] gap-3">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Description</span>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Qty</span>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Unit price (₦)</span>
            <span />
          </div>
          {lineItems.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_72px_116px_36px] gap-3 items-center">
              <input
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
                placeholder="e.g. Logo design"
                value={item.description}
                onChange={(e) => updateLineItem(i, 'description', e.target.value)}
              />
              <input
                type="number"
                min={1}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
                value={item.quantity}
                onChange={(e) => updateLineItem(i, 'quantity', e.target.value)}
              />
              <input
                type="number"
                min={0}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
                value={item.unit_price}
                onChange={(e) => updateLineItem(i, 'unit_price', e.target.value)}
              />
              <button
                onClick={() => removeLineItem(i)}
                disabled={lineItems.length === 1}
                className="p-2 text-gray-300 hover:text-red-400 disabled:opacity-30 transition-colors rounded-lg hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <div className="border-t border-gray-50 pt-4 mt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Platform fee (1.5%)</span><span>{formatCurrency(platformFee)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-50">
              <span>Total</span><span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Due date */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Details</h2>
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
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'draft')}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
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
