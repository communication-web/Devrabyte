'use client'

import { useEffect, useRef, useState } from 'react'
import { TrendingUp, Wallet, Clock, ArrowDownToLine } from 'lucide-react'
import { cn } from '@/lib/utils'

function useCountUp(target: number, delay = 0) {
  const [value, setValue] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      if (target === 0) { setValue(0); return }
      startRef.current = null
      const duration = 1000
      const tick = (ts: number) => {
        if (!startRef.current) startRef.current = ts
        const p = Math.min((ts - startRef.current) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setValue(Math.round(eased * target))
        if (p < 1) rafRef.current = requestAnimationFrame(tick)
        else setValue(target)
      }
      rafRef.current = requestAnimationFrame(tick)
    }, delay)
    return () => {
      clearTimeout(t)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, delay])

  return value
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `₦${Math.round(n / 1_000)}K`
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`
  return `₦${n.toLocaleString()}`
}

interface CellProps {
  label: string
  value: number
  sub: string
  icon: React.ElementType
  delay?: number
  accent?: string
  last?: boolean
}

function Cell({ label, value, sub, icon: Icon, delay = 0, accent = 'text-white', last }: CellProps) {
  const counted = useCountUp(value, delay)
  return (
    <div className={cn(
      'flex-1 min-w-0 px-5 py-4',
      !last && 'border-r border-white/[0.06]'
    )}>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.15em] leading-none">{label}</span>
        <Icon className="h-3 w-3 text-zinc-700 shrink-0" />
      </div>
      <p className={cn('font-mono text-[22px] font-bold tabular-nums tracking-tight leading-none', accent)}>
        {fmt(counted)}
      </p>
      <p className="text-[10px] text-zinc-600 mt-1.5 leading-none">{sub}</p>
    </div>
  )
}

export interface MetricsBandProps {
  totalEarned: number
  availableBalance: number
  pendingAmount: number
  paidOut: number
}

export function MetricsBand({ totalEarned, availableBalance, pendingAmount, paidOut }: MetricsBandProps) {
  return (
    <div className="bg-zinc-900/80 rounded-xl border border-white/[0.07] overflow-hidden">
      <div className="flex divide-x divide-white/[0.06]">
        <Cell label="Total Earned" value={totalEarned} sub="All time" icon={TrendingUp} delay={0} />
        <Cell
          label="Available"
          value={availableBalance}
          sub="Ready to withdraw"
          icon={Wallet}
          accent={availableBalance > 0 ? 'text-emerald-400' : 'text-white'}
          delay={80}
        />
        <Cell
          label="Pending"
          value={pendingAmount}
          sub="Awaiting payment"
          icon={Clock}
          accent={pendingAmount > 0 ? 'text-amber-400' : 'text-zinc-400'}
          delay={160}
        />
        <Cell label="Paid Out" value={paidOut} sub="Total transferred" icon={ArrowDownToLine} delay={240} last />
      </div>
    </div>
  )
}
