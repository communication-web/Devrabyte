import { formatCurrency } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  amount: number
  icon: LucideIcon
  color: 'violet' | 'green' | 'yellow' | 'blue'
  subtitle?: string
}

const colorMap = {
  violet: {
    icon: 'bg-violet-500/10 text-violet-400',
    accent: 'from-violet-500/10',
  },
  green: {
    icon: 'bg-emerald-500/10 text-emerald-400',
    accent: 'from-emerald-500/10',
  },
  yellow: {
    icon: 'bg-amber-500/10 text-amber-400',
    accent: 'from-amber-500/10',
  },
  blue: {
    icon: 'bg-sky-500/10 text-sky-400',
    accent: 'from-sky-500/10',
  },
}

export function StatsCard({ label, amount, icon: Icon, color, subtitle }: StatsCardProps) {
  const c = colorMap[color]
  return (
    <div className="relative bg-zinc-900 rounded-xl border border-white/[0.07] p-5 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${c.accent} to-transparent opacity-40 pointer-events-none`} />
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">{label}</p>
          <p className="text-2xl font-bold text-white leading-none">{formatCurrency(amount)}</p>
          {subtitle && <p className="text-xs text-zinc-500 mt-1.5">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${c.icon} shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
