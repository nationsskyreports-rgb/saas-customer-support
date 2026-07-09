import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardCardProps {
  title: string
  value: string
  change: string
  icon: LucideIcon
  iconColor?: string
  trendPositive?: boolean
}

export function DashboardCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-nos-gold',
  trendPositive = true,
}: DashboardCardProps) {
  return (
    <div className="bg-white border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <Icon className={cn('w-8 h-8', iconColor)} />
        <span className={cn('text-sm font-semibold px-2 py-1 rounded', trendPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
          {change}
        </span>
      </div>
      <p className="text-muted-foreground text-sm mb-2">{title}</p>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  )
}
