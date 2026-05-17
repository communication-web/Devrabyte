import { Card, CardContent } from '@/components/ui/card'
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
  violet: 'bg-violet-50 text-violet-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  blue: 'bg-blue-50 text-blue-600',
}

export function StatsCard({ label, amount, icon: Icon, color, subtitle }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(amount)}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
