'use client'

import { useState, useMemo } from 'react'

export type Period = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom'

export const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  month: 'This Month',
  custom: 'Custom',
}

export function getPeriodRange(period: Period, customFrom: string, customTo: string): { from: Date; to: Date } {
  const now = new Date()
  const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
  const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }

  switch (period) {
    case 'today': return { from: startOfDay(now), to: endOfDay(now) }
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      return { from: startOfDay(y), to: endOfDay(y) }
    }
    case '7d': {
      const f = new Date(now); f.setDate(f.getDate() - 6)
      return { from: startOfDay(f), to: endOfDay(now) }
    }
    case '30d': {
      const f = new Date(now); f.setDate(f.getDate() - 29)
      return { from: startOfDay(f), to: endOfDay(now) }
    }
    case 'month': {
      const f = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: f, to: endOfDay(now) }
    }
    case 'custom': {
      const f = customFrom ? new Date(customFrom + 'T00:00:00') : startOfDay(now)
      const t = customTo ? new Date(customTo + 'T23:59:59') : endOfDay(now)
      return { from: f, to: t }
    }
  }
}

/**
 * One hook for every report page:
 *   const p = usePeriod('7d')
 *   ...fetch with p.fromIso / p.toIso, re-run on [p.fromIso, p.toIso]
 *   <PeriodFilter {...p.bind} />
 */
export function usePeriod(initial: Period = '7d') {
  const [period, setPeriod] = useState<Period>(initial)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const range = useMemo(() => {
    const { from, to } = getPeriodRange(period, customFrom, customTo)
    return { fromIso: from.toISOString(), toIso: to.toISOString() }
  }, [period, customFrom, customTo])

  const label = period === 'custom' && customFrom
    ? `${customFrom} → ${customTo || 'today'}`
    : PERIOD_LABELS[period]

  return {
    period, customFrom, customTo,
    fromIso: range.fromIso, toIso: range.toIso, label,
    bind: { period, setPeriod, customFrom, setCustomFrom, customTo, setCustomTo },
  }
}

export function PeriodFilter({ period, setPeriod, customFrom, setCustomFrom, customTo, setCustomTo }: {
  period: Period
  setPeriod: (p: Period) => void
  customFrom: string
  setCustomFrom: (v: string) => void
  customTo: string
  setCustomTo: (v: string) => void
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-2 flex-wrap">
      {(['today', 'yesterday', '7d', '30d', 'month', 'custom'] as Period[]).map(p => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            period === p ? 'text-white' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'
          }`}
          style={period === p ? { backgroundColor: '#00B69B' } : undefined}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
      {period === 'custom' && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
      )}
    </div>
  )
}
