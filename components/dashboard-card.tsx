import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardCardProps {
  title: string
  value: string
  change: string
  icon: LucideIcon
  color: string
}

export function DashboardCard({
  title,
  value,
  change,
  icon: Icon,
  color,
}: DashboardCardProps) {
  const isPositive = change.startsWith('+')

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-2 rounded-lg', color)}>
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <span className={cn('text-sm font-semibold', isPositive ? 'text-green-600' : 'text-red-600')}>
          {change}
        </span>
      </div>
      <p className="text-muted-foreground text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  )
}
