'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Building2, Mail, Phone, Globe, Instagram,
  Flame, Thermometer, Sprout, Edit2, Save, X, Trash2,
  MapPin, Tag, Radio, Calendar, CheckCircle2, PhoneCall,
} from 'lucide-react'
import { Lead, LeadIndustry, LeadLocation, LeadSource, LeadStatus } from '@/types/leads'
import { cn } from '@/lib/utils'

const INDUSTRY_LABELS: Record<LeadIndustry, string> = {
  music: 'Music', film: 'Film/TV', photography: 'Photography',
  podcast: 'Podcast', advertising: 'Advertising', events: 'Events',
  real_estate: 'Real Estate', corporate: 'Corporate', diaspora: 'Diaspora', other: 'Other',
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

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#f87171' : score >= 60 ? '#fbbf24' : '#34d399'
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#1f1f2e" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="text-center">
        <p className="text-xl font-bold font-mono text-white tabular-nums">{score}</p>
        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">score</p>
      </div>
    </div>
  )
}

function TierIcon({ tier }: { tier: 1 | 2 | 3 }) {
  if (tier === 1) return <Flame className="h-4 w-4 text-red-400" />
  if (tier === 2) return <Thermometer className="h-4 w-4 text-amber-400" />
  return <Sprout className="h-4 w-4 text-emerald-400" />
}

function tierLabel(tier: 1 | 2 | 3) {
  return tier === 1 ? 'Tier 1 — Hot' : tier === 2 ? 'Tier 2 — Warm' : 'Tier 3 — Emerging'
}

function tierColor(tier: 1 | 2 | 3) {
  return tier === 1 ? 'text-red-400' : tier === 2 ? 'text-amber-400' : 'text-emerald-400'
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [editNotes, setEditNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/leads/${id}`)
      .then((r) => r.json())
      .then((d) => { setLead(d.lead); setNotes(d.lead?.notes || '') })
      .finally(() => setLoading(false))
  }, [id])

  async function saveNotes() {
    setSaving(true)
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    const d = await res.json()
    setLead(d.lead)
    setEditNotes(false)
    setSaving(false)
  }

  async function updateStatus(status: LeadStatus) {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const d = await res.json()
    setLead(d.lead)
  }

  async function handleDelete() {
    if (!confirm('Delete this lead permanently?')) return
    await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    router.push('/leads')
  }

  if (loading) return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 bg-zinc-800 rounded w-48" />
      <div className="h-48 bg-zinc-900 rounded-xl border border-white/[0.07]" />
    </div>
  )

  if (!lead) return (
    <div className="text-center py-20">
      <p className="text-zinc-500">Lead not found.</p>
      <button onClick={() => router.push('/leads')} className="text-violet-400 text-sm mt-2 hover:underline">← Back to leads</button>
    </div>
  )

  const contactName = [lead.first_name, lead.last_name].filter(Boolean).join(' ')

  // Score breakdown
  const scoreBreakdown = [
    { label: 'Industry alignment',    points: 20, earned: lead.industry !== 'other' },
    { label: 'Lagos / key area',      points: 15, earned: ['lekki','victoria_island','ikoyi','yaba'].includes(lead.location) },
    { label: 'Active social (1k+)',   points: 15, earned: (lead.followers_count ?? 0) > 1000 },
    { label: 'Has website',           points: 10, earned: lead.has_website },
    { label: 'Recent activity',       points: 10, earned: lead.recent_activity },
    { label: 'Diaspora / intl signal',points: 10, earned: lead.is_diaspora || lead.location === 'international' },
    { label: 'Decision-maker title',  points: 10, earned: /ceo|coo|cfo|director|manager|owner|founder|head|president|partner|executive/i.test(lead.decision_maker_title ?? '') },
  ]

  const nextStatuses: Partial<Record<LeadStatus, { status: LeadStatus; label: string; icon: React.ElementType; color: string }>> = {
    new:               { status: 'contacted',         label: 'Mark as Contacted',   icon: PhoneCall,    color: 'text-sky-400 border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20' },
    contacted:         { status: 'meeting_scheduled', label: 'Schedule Meeting',     icon: Calendar,     color: 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20' },
    meeting_scheduled: { status: 'closed_won',        label: 'Mark as Closed Won',  icon: CheckCircle2, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20' },
  }
  const next = nextStatuses[lead.status]

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/leads')}
          className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors text-zinc-500 hover:text-zinc-200">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.16em]">Lead Detail</p>
          <h1 className="text-base font-semibold text-white">{lead.company_name}</h1>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row gap-5">
          {/* Score ring */}
          <div className="flex flex-col items-center gap-3 sm:pr-5 sm:border-r sm:border-white/[0.06]">
            <ScoreRing score={lead.score} />
            <div className="flex items-center gap-1.5">
              <TierIcon tier={lead.tier} />
              <span className={cn('text-xs font-bold', tierColor(lead.tier))}>{tierLabel(lead.tier)}</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.1em] mb-1">Company</p>
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span className="text-sm font-semibold text-white">{lead.company_name}</span>
              </div>
            </div>
            {contactName && (
              <div>
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.1em] mb-1">Contact</p>
                <p className="text-sm text-zinc-200">{contactName}</p>
                {lead.decision_maker_title && <p className="text-xs text-zinc-500">{lead.decision_maker_title}</p>}
              </div>
            )}
            {lead.email && (
              <div>
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.1em] mb-1">Email</p>
                <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-sm text-sky-400 hover:underline">
                  <Mail className="h-3.5 w-3.5" /> {lead.email}
                </a>
              </div>
            )}
            {lead.phone && (
              <div>
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.1em] mb-1">Phone</p>
                <div className="flex items-center gap-1.5 text-sm text-zinc-200">
                  <Phone className="h-3.5 w-3.5 text-zinc-500" /> {lead.phone}
                </div>
              </div>
            )}
            <div>
              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.1em] mb-1">Location</p>
              <div className="flex items-center gap-1.5 text-sm text-zinc-200">
                <MapPin className="h-3.5 w-3.5 text-zinc-500" /> {LOCATION_LABELS[lead.location]}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.1em] mb-1">Industry</p>
              <div className="flex items-center gap-1.5 text-sm text-zinc-200">
                <Tag className="h-3.5 w-3.5 text-zinc-500" /> {INDUSTRY_LABELS[lead.industry]}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.1em] mb-1">Source</p>
              <div className="flex items-center gap-1.5 text-sm text-zinc-200">
                <Radio className="h-3.5 w-3.5 text-zinc-500" /> {SOURCE_LABELS[lead.source]}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.1em] mb-1">Status</p>
              <span className="text-sm font-medium text-zinc-200">{STATUS_LABELS[lead.status]}</span>
            </div>
            {lead.website && (
              <div>
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.1em] mb-1">Website</p>
                <a href={lead.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-violet-400 hover:underline">
                  <Globe className="h-3.5 w-3.5" /> Visit site
                </a>
              </div>
            )}
            {lead.instagram_handle && (
              <div>
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.1em] mb-1">Instagram</p>
                <div className="flex items-center gap-1.5 text-sm text-zinc-200">
                  <Instagram className="h-3.5 w-3.5 text-zinc-500" />
                  {lead.instagram_handle}
                  {lead.followers_count > 0 && (
                    <span className="text-[10px] text-zinc-500">· {lead.followers_count.toLocaleString()} followers</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline action */}
      {next && (
        <button onClick={() => updateStatus(next.status)}
          className={cn('inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-95', next.color)}>
          <next.icon className="h-4 w-4" />
          {next.label}
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Score breakdown */}
        <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.05]">
            <span className="text-sm font-semibold text-white">Score Breakdown</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {scoreBreakdown.map(({ label, points, earned }) => (
              <div key={label} className="flex items-center justify-between px-5 py-2.5">
                <div className="flex items-center gap-2">
                  <div className={cn('w-1.5 h-1.5 rounded-full', earned ? 'bg-emerald-400' : 'bg-zinc-700')} />
                  <span className={cn('text-xs', earned ? 'text-zinc-200' : 'text-zinc-600')}>{label}</span>
                </div>
                <span className={cn('text-xs font-mono font-bold tabular-nums', earned ? 'text-emerald-400' : 'text-zinc-700')}>
                  {earned ? `+${points}` : `+0`}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-2.5 bg-zinc-800/40">
              <span className="text-xs font-bold text-zinc-300">Total</span>
              <span className="text-sm font-mono font-bold text-white">{lead.score} / 90</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
            <span className="text-sm font-semibold text-white">Notes</span>
            {!editNotes ? (
              <button onClick={() => setEditNotes(true)}
                className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors">
                <Edit2 className="h-3.5 w-3.5 text-zinc-500" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button onClick={saveNotes} disabled={saving}
                  className="p-1.5 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-colors">
                  <Save className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => { setEditNotes(false); setNotes(lead.notes || '') }}
                  className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors">
                  <X className="h-3.5 w-3.5 text-zinc-500" />
                </button>
              </div>
            )}
          </div>
          <div className="px-5 py-4">
            {editNotes ? (
              <textarea
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-sm rounded-lg bg-zinc-800/60 border border-white/[0.1] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500 p-3 resize-none transition-colors"
                placeholder="Add notes about this prospect…"
              />
            ) : (
              <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
                {lead.notes || <span className="text-zinc-600 italic">No notes yet. Click edit to add some.</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="flex justify-end pt-2">
        <button onClick={handleDelete}
          className="flex items-center gap-2 text-xs font-medium text-zinc-600 hover:text-red-400 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
          Delete this lead
        </button>
      </div>
    </div>
  )
}
