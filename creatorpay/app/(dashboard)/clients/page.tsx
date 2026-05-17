'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Users, Search, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Client } from '@/types'

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
          <p className="text-gray-500 text-sm mt-0.5">{clients.length} total</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add client
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">{editClient ? 'Edit client' : 'New client'}</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Name" placeholder="John Doe" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              <Input label="Email" type="email" placeholder="john@brand.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
              <Input label="Phone" placeholder="+234..." value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <Input label="Company" placeholder="Brand name" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
              {error && <div className="sm:col-span-2 text-sm text-red-600">{error}</div>}
              <div className="sm:col-span-2 flex gap-3">
                <Button type="submit" loading={formLoading}>{editClient ? 'Save changes' : 'Create client'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">{search ? 'No clients match your search' : 'No clients yet. Add your first client.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((client) => (
                <div key={client.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-500">{client.email}{client.company ? ` · ${client.company}` : ''}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Added {formatDate(client.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(client)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(client.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
