'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Users, Search, Pencil, Trash2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Client } from '@/types'

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '' })

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/clients')
    const data = await res.json()
    setClients(data.clients || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  function openCreate() {
    setForm({ name: '', email: '', phone: '', company: '' })
    setEditClient(null)
    setShowForm(true)
    setError('')
  }

  function openEdit(client: Client) {
    setForm({ name: client.name, email: client.email, phone: client.phone || '', company: client.company || '' })
    setEditClient(client)
    setShowForm(true)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setError('')
    try {
      const url = editClient ? `/api/clients/${editClient.id}` : '/api/clients'
      const method = editClient ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to save client')
        return
      }
      setShowForm(false)
      fetchClients()
    } catch {
      setError('Something went wrong')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this client?')) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    fetchClients()
  }

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-400 text-sm mt-0.5">{clients.length} total</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add client
        </Button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">{editClient ? 'Edit client' : 'New client'}</h2>
            <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="px-5 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Name" placeholder="John Doe" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              <Input label="Email" type="email" placeholder="john@brand.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
              <Input label="Phone (optional)" placeholder="+234..." value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <Input label="Company (optional)" placeholder="Brand name" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="flex gap-3 mt-4">
              <Button type="submit" loading={formLoading}>{editClient ? 'Save changes' : 'Create client'}</Button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 bg-gray-50/50"
              placeholder="Search by name, email, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-100 rounded w-36 animate-pulse" />
                  <div className="h-3 bg-gray-50 rounded w-48 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              {search ? 'No clients match your search' : 'No clients yet'}
            </p>
            {!search && (
              <button onClick={openCreate} className="text-sm text-violet-600 hover:text-violet-700 font-medium">
                Add your first client →
              </button>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((client) => (
              <div key={client.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/70 transition-colors border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs shrink-0">
                  {initials(client.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{client.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {client.email}{client.company ? ` · ${client.company}` : ''}
                  </p>
                </div>
                <p className="text-xs text-gray-400 hidden sm:block">Added {formatDate(client.created_at)}</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(client)}
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
