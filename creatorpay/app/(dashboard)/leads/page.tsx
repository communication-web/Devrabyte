'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Target, Plus, Search, X, Filter, ChevronDown,
  Building2, Mail, Phone, Globe, Instagram,
  Flame, Thermometer, Sprout, ExternalLink, Trash2,
  CheckCircle2, Calendar, PhoneCall, TrendingUp, Radio,
} from 'lucide-react'
import Link from 'next/link'
import { Lead, LeadIndustry, LeadLocation, LeadSource, LeadStatus, LeadStats } from '@/types/leads'
import { cn } from '@/lib/utils'

// ─── Label maps ─────────────────────────────────────────────────────────────

const INDUSTRY_LABELS: Record<LeadIndustry, string> = {
  music: 'Music', film: 'Film/TV', photography: 'Photography',
  podcast: 'Podcast', advertising: 'Advertising', events: 'Events',
  real_estate: 'Real Estate', corporate: 'Corporate', diaspora: 'Diaspora',
  other: 'Other',
}
const LOCATION_LABELS: Record<LeadLocation, string> = {
  lekki: 'Lekki', victoria_island: 'Victoria Island', ikoyi: 'Ikoyi',
  yaba: 'Yaba', other_lagos: 'Other Lagos', international: 'International',
}
const SOURCE_LABELS: Record<LeadSource, string> = {
  instagram: 'Instagram', google_maps: 'Google Maps', linkedin: 'LinkedIn',
  directory: 'Directory', event_site: 'Events', cac_registry: 'CAC Registry', manual: 'Manual',
}
const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New', contacted: 'Contacted', meeting_scheduled: 'Meeting Scheduled',
  closed_won: 'Closed Won', closed_lost: 'Closed Lost', opted_out: 'Opted Out',
}

// ─── Visual helpers ──────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: 1 | 2 | 3 }) {
  if (tier === 1) return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5 uppercase tracking-wider">
      <Flame className="h-2.5 w-2.5" /> Hot
    </span>
  )
  if (tier === 2) return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5 uppercase tracking-wider">
      <Thermometer className="h-2.5 w-2.5" /> Warm
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 uppercase tracking-wider">
      <Sprout className="h-2.5 w-2.5" /> Emerging
    </span>
  )
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const styles: Record<LeadStatus, string> = {
    new:               'text-violet-300 bg-violet-500/10 border-violet-500/20',
    contacted:         'text-sky-300 bg-sky-500/10 border-sky-500/20',
    meeting_scheduled: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
    closed_won:        'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    closed_lost:       'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
    opted_out:         'text-red-400 bg-red-500/10 border-red-500/20',
  }
  return (
    <span className={cn('inline-flex items-center text-[9px] font-bold border rounded-full px-2 py-0.5 uppercase tracking-wider', styles[status])}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-red-400' : score >= 60 ? 'bg-amber-400' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-mono font-bold text-zinc-300 tabular-nums">{score}</span>
    </div>
  )
}

// ─── Add Lead Form ────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  company_name: '', first_name: '', last_name: '', decision_maker_title: '',
  email: '', phone: '', website: '', instagram_handle: '',
  industry: 'other' as LeadIndustry, location: 'other_lagos' as LeadLocation,
  source: 'manual' as LeadSource, followers_count: '',
  has_website: false, recent_activity: false, is_diaspora: false, notes: '',
}

function AddLeadForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function f(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }))
    }
  }
  function toggle(field: 'has_website' | 'recent_activity' | 'is_diaspora') {
    setForm((p) => ({ ...p, [field]: !p[field] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, followers_count: parseInt(form.followers_count || '0', 10) }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); return }
      onCreated()
    } catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
        <h2 className="text-sm font-semibold text-white">Add Lead Manually</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors">
          <X className="h-4 w-4 text-zinc-400" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="px-5 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Company Name *">
            <input required value={form.company_name} onChange={f('company_name')} placeholder="FreshSound Studio" className={inputCls} />
          </Field>
          <Field label="First Name">
            <input value={form.first_name} onChange={f('first_name')} placeholder="Kemi" className={inputCls} />
          </Field>
          <Field label="Last Name">
            <input value={form.last_name} onChange={f('last_name')} placeholder="Adeyemi" className={inputCls} />
          </Field>
          <Field label="Title / Role">
            <input value={form.decision_maker_title} onChange={f('decision_maker_title')} placeholder="CEO, Creative Director…" className={inputCls} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={f('email')} placeholder="contact@studio.com" className={inputCls} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={f('phone')} placeholder="+234 801 234 5678" className={inputCls} />
          </Field>
          <Field label="Industry">
            <select value={form.industry} onChange={f('industry')} className={inputCls}>
              {(Object.keys(INDUSTRY_LABELS) as LeadIndustry[]).map((k) => (
                <option key={k} value={k}>{INDUSTRY_LABELS[k]}</option>
              ))}
            </select>
          </Field>
          <Field label="Location">
            <select value={form.location} onChange={f('location')} className={inputCls}>
              {(Object.keys(LOCATION_LABELS) as LeadLocation[]).map((k) => (
                <option key={k} value={k}>{LOCATION_LABELS[k]}</option>
              ))}
            </select>
          </Field>
          <Field label="Source">
            <select value={form.source} onChange={f('source')} className={inputCls}>
              {(Object.keys(SOURCE_LABELS) as LeadSource[]).map((k) => (
                <option key={k} value={k}>{SOURCE_LABELS[k]}</option>
              ))}
            </select>
          </Field>
          <Field label="Followers Count">
            <input type="number" min="0" value={form.followers_count} onChange={f('followers_count')} placeholder="0" className={inputCls} />
          </Field>
          <Field label="Website">
            <input value={form.website} onChange={f('website')} placeholder="https://studio.com" className={inputCls} />
          </Field>
          <Field label="Instagram Handle">
            <input value={form.instagram_handle} onChange={f('instagram_handle')} placeholder="@freshsound" className={inputCls} />
          </Field>
        </div>

        {/* Boolean signals */}
        <div className="flex flex-wrap gap-3 mt-4">
          {([
            ['has_website',    'Has website'],
            ['recent_activity','Recent activity'],
            ['is_diaspora',    'Diaspora / International'],
          ] as const).map(([field, label]) => (
            <button key={field} type="button" onClick={() => toggle(field)}
              className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                form[field]
                  ? 'bg-violet-600/15 border-violet-500/30 text-violet-300'
                  : 'bg-zinc-800/50 border-white/[0.07] text-zinc-500 hover:text-zinc-300'
              )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', form[field] ? 'bg-violet-400' : 'bg-zinc-600')} />
              {label}
            </button>
          ))}
        </div>

        <Field label="Notes" className="mt-4">
          <textarea rows={2} value={form.notes} onChange={f('notes')} placeholder="Any relevant context…" className={cn(inputCls, 'resize-none')} />
        </Field>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="flex gap-3 mt-5">
          <button type="submit" disabled={loading}
            className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-500 active:scale-95 transition-all disabled:opacity-50">
            {loading ? 'Saving…' : 'Add Lead'}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em]">{label}</label>
      {children}
    </div>
  )
}
const inputCls = 'w-full px-3 py-2 text-sm rounded-lg bg-zinc-800/60 border border-white/[0.1] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500 transition-colors'

// ─── Main page ───────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTier, setFilterTier] = useState('')
  const [filterSource, setFilterSource] = useState('')

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (filterStatus) params.set('status', filterStatus)
    if (filterTier)   params.set('tier', filterTier)
    if (filterSource) params.set('source', filterSource)
    if (search)       params.set('search', search)

    const [leadsRes, statsRes] = await Promise.all([
      fetch(`/api/leads?${params}`),
      fetch('/api/leads/stats'),
    ])
    const ld = await leadsRes.json()
    const st = await statsRes.json()
    setLeads(ld.leads || [])
    setStats(st)
    setLoading(false)
  }, [search, filterStatus, filterTier, filterSource])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  async function updateStatus(id: string, status: LeadStatus) {
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchLeads()
  }

  async function deleteLead(id: string) {
    if (!confirm('Delete this lead?')) return
    await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    fetchLeads()
  }

  const activeFilters = [filterStatus, filterTier, filterSource].filter(Boolean).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.16em]">The FreeMe Space · Lead Pipeline</p>
          <h1 className="text-base font-semibold text-white mt-0.5">
            Sales CRM <span className="text-zinc-500 font-normal">— prospect intelligence</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/leads/scraper"
            className="inline-flex items-center gap-1.5 bg-zinc-800 text-zinc-300 px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-700 active:scale-95 transition-all border border-white/[0.07]"
          >
            <Radio className="h-3.5 w-3.5" />
            Scraper
          </Link>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 bg-violet-600 text-white px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-violet-500 active:scale-95 transition-all shadow-sm shadow-violet-900/40"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Stats band */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          {[
            { label: 'Total Leads',   value: stats.total,     color: 'text-white',        bg: 'bg-zinc-900' },
            { label: 'New Today',     value: stats.new_today, color: 'text-violet-300',   bg: 'bg-violet-600/10' },
            { label: 'Tier 1 — Hot',  value: stats.tier1,     color: 'text-red-400',      bg: 'bg-red-500/10' },
            { label: 'Tier 2 — Warm', value: stats.tier2,     color: 'text-amber-400',    bg: 'bg-amber-500/10' },
            { label: 'Tier 3',        value: stats.tier3,     color: 'text-emerald-400',  bg: 'bg-emerald-500/10' },
            { label: 'Contacted',     value: stats.contacted, color: 'text-sky-300',      bg: 'bg-sky-500/10' },
            { label: 'Meetings',      value: stats.meetings,  color: 'text-amber-300',    bg: 'bg-amber-500/10' },
            { label: 'Won',           value: stats.won,       color: 'text-emerald-300',  bg: 'bg-emerald-500/10' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={cn('rounded-xl border border-white/[0.06] px-4 py-3', bg)}>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.12em]">{label}</p>
              <p className={cn('text-xl font-bold font-mono tabular-nums mt-1', color)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add lead form */}
      {showForm && (
        <AddLeadForm
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); fetchLeads() }}
        />
      )}

      {/* Filters */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] px-4 py-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-zinc-800/60 border border-white/[0.08] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
              placeholder="Search by company, name, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus}
            options={[['', 'All Statuses'], ...Object.entries(STATUS_LABELS) as [string, string][]]} />
          <FilterSelect label="Tier" value={filterTier} onChange={setFilterTier}
            options={[['', 'All Tiers'], ['1', 'Tier 1 — Hot'], ['2', 'Tier 2 — Warm'], ['3', 'Tier 3 — Emerging']]} />
          <FilterSelect label="Source" value={filterSource} onChange={setFilterSource}
            options={[['', 'All Sources'], ...Object.entries(SOURCE_LABELS) as [string, string][]]} />

          {activeFilters > 0 && (
            <button onClick={() => { setFilterStatus(''); setFilterTier(''); setFilterSource('') }}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              <X className="h-3 w-3" /> Clear ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {/* Leads table */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">Lead Pipeline</span>
            {stats && (
              <span className="text-[10px] text-zinc-600 font-mono">{leads.length} shown</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="h-3 w-3 text-zinc-600" />
            <span className="text-[10px] text-zinc-600">Score ↓</span>
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="h-3 bg-zinc-800 rounded w-40 animate-pulse" />
                <div className="h-3 bg-zinc-800/60 rounded w-28 animate-pulse" />
                <div className="h-3 bg-zinc-800/60 rounded w-20 animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="h-6 w-6 text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-zinc-500 mb-1">
              {search || activeFilters > 0 ? 'No leads match your filters' : 'No leads yet'}
            </p>
            {!search && activeFilters === 0 && (
              <button onClick={() => setShowForm(true)} className="text-sm text-violet-400 hover:text-violet-300 font-medium mt-1 transition-colors">
                Add your first lead →
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="hidden xl:grid grid-cols-[1fr_160px_100px_80px_100px_130px_120px] gap-3 px-5 py-2 border-b border-white/[0.03]">
              {['Company', 'Contact', 'Industry', 'Score', 'Tier', 'Status', 'Actions'].map((h) => (
                <span key={h} className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.12em]">{h}</span>
              ))}
            </div>

            <div className="divide-y divide-white/[0.04]">
              {leads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} onStatusChange={updateStatus} onDelete={deleteLead} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Lead row ────────────────────────────────────────────────────────────────

function LeadRow({
  lead,
  onStatusChange,
  onDelete,
}: {
  lead: Lead
  onStatusChange: (id: string, status: LeadStatus) => void
  onDelete: (id: string) => void
}) {
  const [showActions, setShowActions] = useState(false)
  const contactName = [lead.first_name, lead.last_name].filter(Boolean).join(' ')

  return (
    <div className="group hover:bg-white/[0.03] transition-colors">
      <div className="xl:grid xl:grid-cols-[1fr_160px_100px_80px_100px_130px_120px] gap-3 items-center px-5 py-3 flex flex-wrap gap-y-2">

        {/* Company */}
        <div className="min-w-0 xl:min-w-0 w-full xl:w-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <Building2 className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-zinc-100 truncate">{lead.company_name}</p>
              <p className="text-[10px] text-zinc-600 truncate">{LOCATION_LABELS[lead.location]}</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="min-w-0 hidden xl:block">
          {contactName ? (
            <>
              <p className="text-[11px] text-zinc-300 truncate">{contactName}</p>
              {lead.decision_maker_title && (
                <p className="text-[10px] text-zinc-600 truncate">{lead.decision_maker_title}</p>
              )}
            </>
          ) : (
            <span className="text-[10px] text-zinc-600">—</span>
          )}
        </div>

        {/* Industry */}
        <div className="hidden xl:block">
          <span className="text-[10px] text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-md">
            {INDUSTRY_LABELS[lead.industry]}
          </span>
        </div>

        {/* Score */}
        <div className="hidden xl:block">
          <ScoreBar score={lead.score} />
        </div>

        {/* Tier */}
        <div className="hidden xl:block">
          <TierBadge tier={lead.tier} />
        </div>

        {/* Status */}
        <div className="hidden xl:block">
          <StatusBadge status={lead.status} />
        </div>

        {/* Actions */}
        <div className="hidden xl:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionMenu lead={lead} onStatusChange={onStatusChange} onDelete={onDelete}
            show={showActions} setShow={setShowActions} />
        </div>

        {/* Mobile — show tier + status */}
        <div className="xl:hidden flex items-center gap-2 w-full">
          <TierBadge tier={lead.tier} />
          <StatusBadge status={lead.status} />
          <ScoreBar score={lead.score} />
          <div className="ml-auto">
            <ActionMenu lead={lead} onStatusChange={onStatusChange} onDelete={onDelete}
              show={showActions} setShow={setShowActions} />
          </div>
        </div>
      </div>

      {/* Contact details row */}
      {(lead.email || lead.phone || lead.website) && (
        <div className="flex items-center gap-4 px-5 pb-2.5 -mt-1">
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors">
              <Mail className="h-3 w-3" /> {lead.email}
            </a>
          )}
          {lead.phone && (
            <span className="flex items-center gap-1.5 text-[10px] text-zinc-600">
              <Phone className="h-3 w-3" /> {lead.phone}
            </span>
          )}
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-violet-400 transition-colors">
              <Globe className="h-3 w-3" /> Website
            </a>
          )}
          {lead.instagram_handle && (
            <span className="flex items-center gap-1.5 text-[10px] text-zinc-600">
              <Instagram className="h-3 w-3" /> {lead.instagram_handle}
              {lead.followers_count > 0 && ` · ${lead.followers_count.toLocaleString()}`}
            </span>
          )}
          <span className="text-[10px] text-zinc-700 ml-auto">
            {SOURCE_LABELS[lead.source]}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Action dropdown ──────────────────────────────────────────────────────────

function ActionMenu({
  lead, onStatusChange, onDelete, show, setShow,
}: {
  lead: Lead
  onStatusChange: (id: string, status: LeadStatus) => void
  onDelete: (id: string) => void
  show: boolean
  setShow: (v: boolean) => void
}) {
  const nextStatuses: Partial<Record<LeadStatus, { status: LeadStatus; label: string; icon: React.ElementType }>> = {
    new:               { status: 'contacted',         label: 'Mark Contacted',  icon: PhoneCall },
    contacted:         { status: 'meeting_scheduled', label: 'Schedule Meeting', icon: Calendar },
    meeting_scheduled: { status: 'closed_won',        label: 'Mark Won',        icon: CheckCircle2 },
  }
  const next = nextStatuses[lead.status]

  return (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-700/50 border border-white/[0.07] px-2.5 py-1.5 rounded-lg transition-all"
      >
        Actions <ChevronDown className="h-3 w-3" />
      </button>

      {show && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 border border-white/[0.1] rounded-xl shadow-xl z-20 overflow-hidden"
          onMouseLeave={() => setShow(false)}>
          {next && (
            <button
              onClick={() => { onStatusChange(lead.id, next.status); setShow(false) }}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[11px] font-medium text-zinc-200 hover:bg-white/[0.07] transition-colors"
            >
              <next.icon className="h-3.5 w-3.5 text-violet-400" />
              {next.label}
            </button>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[11px] font-medium text-zinc-200 hover:bg-white/[0.07] transition-colors">
              <Mail className="h-3.5 w-3.5 text-sky-400" />
              Send Email
            </a>
          )}
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[11px] font-medium text-zinc-200 hover:bg-white/[0.07] transition-colors">
              <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
              Visit Website
            </a>
          )}
          {lead.status !== 'closed_won' && lead.status !== 'closed_lost' && (
            <button
              onClick={() => { onStatusChange(lead.id, 'closed_lost'); setShow(false) }}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[11px] font-medium text-zinc-500 hover:bg-white/[0.07] hover:text-zinc-300 transition-colors">
              <TrendingUp className="h-3.5 w-3.5 rotate-180" />
              Mark Lost
            </button>
          )}
          <div className="border-t border-white/[0.06]" />
          <button
            onClick={() => { onDelete(lead.id); setShow(false) }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[11px] font-medium text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
            Delete Lead
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Filter select ────────────────────────────────────────────────────────────

function FilterSelect({ label: _label, value, onChange, options }: {
  label: string; value: string
  onChange: (v: string) => void
  options: [string, string][]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-2 text-xs rounded-lg bg-zinc-800/60 border border-white/[0.08] text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500 transition-colors cursor-pointer"
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
    </div>
  )
}
