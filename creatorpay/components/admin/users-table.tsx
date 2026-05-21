'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Search, ChevronRight, CheckCircle, XCircle } from 'lucide-react'

interface AdminUser {
  id: string
  full_name: string | null
  email: string | null
  business_name: string | null
  category: string | null
  has_bank: boolean
  created_at: string
  invoice_count: number
  total_earned: number
}

interface UsersTableProps {
  users: AdminUser[]
}

export function UsersTable({ users }: UsersTableProps) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? users.filter((u) => {
        const q = query.toLowerCase()
        return (
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.business_name?.toLowerCase().includes(q) ||
          u.category?.toLowerCase().includes(q)
        )
      })
    : users

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
        <input
          type="text"
          placeholder="Search by name, email, or business…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-sm bg-zinc-900 border border-white/[0.07] rounded-lg pl-9 pr-4 py-2 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_1fr_120px_120px_80px_100px_36px] gap-4 px-5 py-2.5 border-b border-white/[0.05]">
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em]">Name</span>
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em]">Email</span>
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em]">Business</span>
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em]">Category</span>
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em] text-center">Bank</span>
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.14em] text-right">Joined</span>
          <span />
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-zinc-600">
              {query ? 'No users match your search.' : 'No users yet.'}
            </p>
          </div>
        ) : (
          filtered.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-[1fr_1fr_120px_120px_80px_100px_36px] gap-4 items-center px-5 py-3 border-b border-white/[0.035] last:border-0 hover:bg-white/[0.03] transition-colors"
            >
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-zinc-200 truncate">{u.full_name || '—'}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5 tabular-nums">
                  {u.invoice_count} invoice{u.invoice_count !== 1 ? 's' : ''}
                </p>
              </div>
              <p className="text-[11px] font-mono text-zinc-500 truncate">{u.email || '—'}</p>
              <p className="text-[11px] text-zinc-500 truncate">{u.business_name || '—'}</p>
              <p className="text-[11px] text-zinc-500 truncate capitalize">{u.category || '—'}</p>
              <div className="flex justify-center">
                {u.has_bank ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-zinc-700" />
                )}
              </div>
              <p className="text-[11px] font-mono text-zinc-600 text-right whitespace-nowrap">
                {formatDate(u.created_at)}
              </p>
              <Link
                href={`/admin/invoices?creator=${u.id}`}
                className="flex items-center justify-center text-zinc-700 hover:text-violet-400 transition-colors"
                title="View invoices"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ))
        )}
      </div>

      <p className="text-[11px] text-zinc-700">
        {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
