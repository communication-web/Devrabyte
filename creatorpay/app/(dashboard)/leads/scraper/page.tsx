'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Play, RefreshCw, Clock, CheckCircle2, XCircle,
  Loader2, Flame, Thermometer, Sprout, Radio,
  ArrowLeft, AlertTriangle, Calendar,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ScrapeRun {
  id:               string
  started_at:       string
  completed_at:     string | null
  status:           'running' | 'completed' | 'failed'
  sources_run:      string[]
  total_found:      number
  total_inserted:   number
  total_duplicates: number
  tier1_found:      number
  tier2_found:      number
  tier3_found:      number
  error_message:    string | null
}

function duration(start: string, end: string | null): string {
  if (!end) return 'running…'
  const s = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

function timeAgo(ts: string): string {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60)   return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400)return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function StatusIcon({ status }: { status: ScrapeRun['status'] }) {
  if (status === 'running')   return <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
  if (status === 'completed') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
  return <XCircle className="h-3.5 w-3.5 text-red-400" />
}

const SOURCE_LABELS: Record<string, string> = {
  google_maps: 'Google Maps',
  instagram:   'Instagram',
  leads_db:    'leads-db (NRDs + Enrichment)',
  directory:   'Directory',
  manual:      'Manual',
}

export default function ScraperPage() {
  const [runs, setRuns]         = useState<ScrapeRun[]>([])
  const [loading, setLoading]   = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [triggerResult, setTriggerResult] = useState<string | null>(null)
  const [sources, setSources]   = useState({ google_maps: true, instagram: true, leads_db: true })

  const fetchRuns = useCallback(async () => {
    const res = await fetch('/api/scrape/runs')
    const d   = await res.json()
    setRuns(d.runs ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchRuns() }, [fetchRuns])

  // Poll while any run is 'running'
  useEffect(() => {
    const hasActive = runs.some((r) => r.status === 'running')
    if (!hasActive) return
    const t = setTimeout(fetchRuns, 5000)
    return () => clearTimeout(t)
  }, [runs, fetchRuns])

  async function triggerRun() {
    const selected = (Object.keys(sources) as (keyof typeof sources)[]).filter((k) => sources[k])
    if (!selected.length) return

    setTriggering(true)
    setTriggerResult(null)

    try {
      const res = await fetch('/api/scrape/trigger', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: selected }),
      })
      const d = await res.json()
      if (!res.ok) {
        setTriggerResult(`Error: ${d.error}`)
      } else {
        setTriggerResult(
          `Done — inserted ${d.total_inserted} new leads ` +
          `(${d.tier1_found} hot, ${d.tier2_found} warm, ${d.tier3_found} emerging). ` +
          `${d.total_duplicates} duplicates skipped.`
        )
        fetchRuns()
      }
    } catch (e) {
      setTriggerResult(`Network error: ${String(e)}`)
    } finally {
      setTriggering(false)
    }
  }

  const lastRun   = runs[0]
  const totalRuns = runs.length

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/leads" className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors text-zinc-500 hover:text-zinc-200">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.16em]">Lead Engine</p>
          <h1 className="text-base font-semibold text-white">Scraper Control Panel</h1>
        </div>
      </div>

      {/* Schedule info */}
      <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl px-5 py-4 flex items-start gap-3">
        <Calendar className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-violet-300">Automated Schedule Active</p>
          <p className="text-xs text-violet-400/70 mt-0.5">
            Runs Mon–Fri at <strong>06:00 WAT</strong> via Netlify Scheduled Function.
            Expected output: <strong>20–50 new qualified leads</strong> per day by noon.
          </p>
        </div>
      </div>

      {/* Manual trigger */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <span className="text-sm font-semibold text-white">Manual Trigger</span>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Source toggles */}
          <div>
            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.1em] mb-2">Sources to run</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(sources) as (keyof typeof sources)[]).map((s) => (
                <button key={s} type="button"
                  onClick={() => setSources((p) => ({ ...p, [s]: !p[s] }))}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    sources[s]
                      ? 'bg-violet-600/15 border-violet-500/30 text-violet-300'
                      : 'bg-zinc-800/50 border-white/[0.07] text-zinc-500 hover:text-zinc-300'
                  )}>
                  <Radio className={cn('h-3 w-3', sources[s] ? 'text-violet-400' : 'text-zinc-600')} />
                  {SOURCE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <button onClick={triggerRun} disabled={triggering}
            className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-500 active:scale-95 transition-all disabled:opacity-50 shadow-sm shadow-violet-900/40">
            {triggering
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Running…</>
              : <><Play className="h-3.5 w-3.5" /> Run now</>
            }
          </button>

          {triggerResult && (
            <div className={cn(
              'flex items-start gap-2 text-xs rounded-lg px-3 py-2.5 border',
              triggerResult.startsWith('Error') || triggerResult.startsWith('Network')
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            )}>
              {triggerResult.startsWith('Error') || triggerResult.startsWith('Network')
                ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                : <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              }
              {triggerResult}
            </div>
          )}
        </div>
      </div>

      {/* Last run summary */}
      {lastRun && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Found',      value: lastRun.total_found,      color: 'text-white' },
            { label: 'Inserted',   value: lastRun.total_inserted,   color: 'text-violet-300' },
            { label: 'Duplicates', value: lastRun.total_duplicates, color: 'text-zinc-400' },
            { label: 'Duration',   value: duration(lastRun.started_at, lastRun.completed_at), color: 'text-zinc-300' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-zinc-900 rounded-xl border border-white/[0.06] px-4 py-3">
              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.1em]">Last run · {label}</p>
              <p className={cn('text-lg font-bold font-mono mt-1', color)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Run history */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
          <span className="text-sm font-semibold text-white">Run History</span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-600">{totalRuns} runs</span>
            <button onClick={fetchRuns} className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors">
              <RefreshCw className="h-3.5 w-3.5 text-zinc-500" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="h-3 bg-zinc-800 rounded w-24 animate-pulse" />
                <div className="h-3 bg-zinc-800/60 rounded w-16 animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        ) : runs.length === 0 ? (
          <div className="py-16 text-center">
            <Clock className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-600">No runs yet. Trigger one above.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {runs.map((run) => (
              <div key={run.id} className="px-5 py-3 hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3">
                  <StatusIcon status={run.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-zinc-400">{timeAgo(run.started_at)}</span>
                      <span className="text-[10px] text-zinc-600">·</span>
                      <span className="text-[10px] text-zinc-600">{duration(run.started_at, run.completed_at)}</span>
                      <span className="text-[10px] text-zinc-600">·</span>
                      <span className="text-[10px] text-zinc-500">{run.sources_run.map((s) => SOURCE_LABELS[s] ?? s).join(', ')}</span>
                    </div>
                    {run.error_message && (
                      <p className="text-[10px] text-red-400 mt-0.5 truncate">{run.error_message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-600">Inserted</p>
                      <p className="text-[12px] font-mono font-bold text-white">{run.total_inserted}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 text-[9px] font-bold text-red-400">
                        <Flame className="h-2.5 w-2.5" />{run.tier1_found}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400">
                        <Thermometer className="h-2.5 w-2.5" />{run.tier2_found}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400">
                        <Sprout className="h-2.5 w-2.5" />{run.tier3_found}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Env var checklist */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.05]">
          <span className="text-sm font-semibold text-white">Required Environment Variables</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {[
            { key: 'GOOGLE_PLACES_API_KEY', desc: 'Google Maps Places API — enables Google Maps scraper', required: true },
            { key: 'SCRAPE_SECRET',          desc: 'Shared secret to authenticate trigger endpoint calls', required: true },
            { key: 'NEXT_PUBLIC_APP_URL',    desc: 'Your deployed app URL (for Netlify cron to call back)', required: true },
            { key: 'FREEME_SUPABASE_URL',    desc: 'Override Supabase URL for leads DB (default: bundled)', required: false },
            { key: 'FREEME_SUPABASE_ANON_KEY',                    desc: 'Override anon key for leads DB (default: bundled)', required: false },
            { key: 'LEADS_DB_URL',                                desc: 'Base URL of your running leads-db Flask server (e.g. https://leads-db.railway.app)', required: false },
            { key: 'LEADS_DB_API_KEY',                            desc: 'Optional bearer token if you add auth to leads-db', required: false },
            { key: 'ABSTRACT_API_COMPANY_ENRICHMENT_API_KEY',     desc: 'Abstract API key for company enrichment (used by leads-db source)', required: false },
            { key: 'ABSTRACT_API_COMPANY_ENRICHMENT_API_URL',     desc: 'Abstract API company enrichment endpoint (default: bundled)', required: false },
            { key: 'ABSTRACT_API_SCRAPE_API_KEY',                 desc: 'Abstract API key for web scraping', required: false },
          ].map(({ key, desc, required }) => (
            <div key={key} className="flex items-start gap-3 px-5 py-3">
              <span className={cn('text-[9px] font-bold uppercase mt-0.5', required ? 'text-red-400' : 'text-zinc-600')}>
                {required ? 'REQ' : 'OPT'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono font-semibold text-zinc-200">{key}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
