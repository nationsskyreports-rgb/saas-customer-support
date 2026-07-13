'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { supabase } from '@/lib/supabase'

interface DayPoint {
  date: string
  conversations: number
  resolved: number
  pending: number
}

export function MetricsChart() {
  const [data, setData] = useState<DayPoint[]>([])

  useEffect(() => {
    const fetchWeekly = async () => {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      sevenDaysAgo.setHours(0, 0, 0, 0)

      const { data: convs } = await supabase
        .from('conversations')
        .select('created_at, resolved_at, status')
        .gte('created_at', sevenDaysAgo.toISOString())

      // Build last 7 day buckets
      const days: DayPoint[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        d.setHours(0, 0, 0, 0)
        const label = d.toLocaleDateString('en-US', { weekday: 'short' })
        const dayStart = d.getTime()
        const dayEnd = dayStart + 24 * 60 * 60 * 1000

        const created = convs?.filter(c => {
          const t = new Date(c.created_at).getTime()
          return t >= dayStart && t < dayEnd
        }) || []

        const resolved = convs?.filter(c => {
          if (!c.resolved_at) return false
          const t = new Date(c.resolved_at).getTime()
          return t >= dayStart && t < dayEnd
        }) || []

        days.push({
          date: label,
          conversations: created.length,
          resolved: resolved.length,
          pending: created.filter(c => c.status === 'pending' || c.status === 'open').length,
        })
      }
      setData(days)
    }
    fetchWeekly()
  }, [])

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Weekly Activity</h3>
        <p className="text-sm text-muted-foreground">Conversations and resolution trends (last 7 days)</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" stroke="var(--muted-foreground)" />
          <YAxis stroke="var(--muted-foreground)" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: `1px solid var(--border)`,
              borderRadius: '0.5rem',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="conversations"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ fill: 'var(--primary)' }}
          />
          <Line
            type="monotone"
            dataKey="resolved"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={{ fill: 'var(--accent)' }}
          />
          <Line
            type="monotone"
            dataKey="pending"
            stroke="var(--muted-foreground)"
            strokeWidth={2}
            dot={{ fill: 'var(--muted-foreground)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
