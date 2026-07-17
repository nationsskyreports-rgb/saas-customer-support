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

interface Point {
  date: string
  conversations: number
  resolved: number
  pending: number
}

interface MetricsChartProps {
  /** ISO string — start of the selected period (from the dashboard filter) */
  fromIso?: string
  /** ISO string — end of the selected period (from the dashboard filter) */
  toIso?: string
  /** Human label of the selected period, e.g. "Last 7 Days" */
  label?: string
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

/**
 * Activity chart driven by the SAME period filter as the rest of the dashboard.
 * - Periods of up to 2 days are bucketed by hour
 * - Longer periods are bucketed by day
 * Falls back to the last 7 days when no range is provided.
 */
export function MetricsChart({ fromIso, toIso, label }: MetricsChartProps) {
  const [data, setData] = useState<Point[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchRange = async () => {
      setLoading(true)

      // Resolve range (fallback: last 7 days)
      let from: Date
      let to: Date
      if (fromIso && toIso) {
        from = new Date(fromIso)
        to = new Date(toIso)
      } else {
        to = new Date()
        from = new Date()
        from.setDate(from.getDate() - 6)
        from.setHours(0, 0, 0, 0)
      }
      if (to.getTime() < from.getTime()) [from, to] = [to, from]

      const fromStr = from.toISOString()
      const toStr = to.toISOString()

      // Conversations created OR resolved inside the selected period
      const { data: convs } = await supabase
        .from('conversations')
        .select('created_at, resolved_at, status')
        .or(
          `and(created_at.gte.${fromStr},created_at.lte.${toStr}),and(resolved_at.gte.${fromStr},resolved_at.lte.${toStr})`
        )

      if (cancelled) return

      const spanMs = to.getTime() - from.getTime()
      const hourly = spanMs <= 2 * DAY
      const bucketMs = hourly ? HOUR : DAY

      // Align first bucket to the hour/day boundary
      const start = new Date(from)
      if (hourly) start.setMinutes(0, 0, 0)
      else start.setHours(0, 0, 0, 0)

      // Hard cap so a huge custom range can never freeze the UI
      const bucketCount = Math.min(
        Math.max(1, Math.ceil((to.getTime() - start.getTime()) / bucketMs)),
        120
      )

      const points: Point[] = []
      for (let i = 0; i < bucketCount; i++) {
        const bStart = start.getTime() + i * bucketMs
        const bEnd = bStart + bucketMs
        const d = new Date(bStart)

        const dateLabel = hourly
          ? d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
          : bucketCount > 10
            ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })

        const created = (convs || []).filter(c => {
          const t = new Date(c.created_at).getTime()
          return t >= bStart && t < bEnd
        })
        const resolved = (convs || []).filter(c => {
          if (!c.resolved_at) return false
          const t = new Date(c.resolved_at).getTime()
          return t >= bStart && t < bEnd
        })

        points.push({
          date: dateLabel,
          conversations: created.length,
          resolved: resolved.length,
          pending: created.filter(c => c.status === 'pending' || c.status === 'open').length,
        })
      }

      setData(points)
      setLoading(false)
    }

    fetchRange()
    return () => { cancelled = true }
  }, [fromIso, toIso])

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Activity</h3>
          <p className="text-sm text-muted-foreground">
            Conversations and resolution trends{label ? ` · ${label}` : ''}
          </p>
        </div>
        {loading && <span className="text-xs text-muted-foreground animate-pulse">Loading…</span>}
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
