'use client'

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

const data = [
  { date: 'Mon', conversations: 120, resolved: 95, pending: 25 },
  { date: 'Tue', conversations: 145, resolved: 118, pending: 27 },
  { date: 'Wed', conversations: 118, resolved: 95, pending: 23 },
  { date: 'Thu', conversations: 165, resolved: 135, pending: 30 },
  { date: 'Fri', conversations: 178, resolved: 148, pending: 30 },
  { date: 'Sat', conversations: 92, resolved: 76, pending: 16 },
  { date: 'Sun', conversations: 108, resolved: 89, pending: 19 },
]

export function MetricsChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Weekly Activity</h3>
        <p className="text-sm text-muted-foreground">Conversations and resolution trends</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" stroke="var(--muted-foreground)" />
          <YAxis stroke="var(--muted-foreground)" />
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
