'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Star, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePeriod, PeriodFilter } from '@/components/period-filter'
import { downloadCSV } from '@/lib/report-utils'
import { useToasts, Toasts } from '@/components/ui/toasts'

interface Agent { id: string; name: string; status: string; is_active: boolean }
interface Conv { assigned_agent_id: string | null; created_at: string; resolved_at: string | null; status: string }

interface AgentStats {
  id: string
  name: string
  status: string
  handled: number
  resolved: number
  openNow: number
  avgHandleMin: number
  score: number
}

export default function AgentPerformanceReportPage() {
  const p = usePeriod('7d')
  const { toasts, showToast, dismissToast } = useToasts()
  const [stats, setStats] = useState<AgentStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      const [aRes, cRes, openRes] = await Promise.all([
        supabase.from('agents').select('id, name, status, is_active').eq('is_active', true).order('name'),
        supabase
          .from('conversations')
          .select('assigned_agent_id, created_at, resolved_at, status')
          .not('assigned_agent_id', 'is', null)
          .or(`and(created_at.gte.${p.fromIso},created_at.lte.${p.toIso}),and(resolved_at.gte.${p.fromIso},resolved_at.lte.${p.toIso})`)
          .limit(20000),
        supabase
          .from('conversations')
          .select('assigned_agent_id')
          .in('status', ['open', 'pending'])
          .not('assigned_agent_id', 'is', null),
      ])
      if (cancelled) return
      if (aRes.error || cRes.error) {
        showToast('error', `Failed to load report: ${(aRes.error || cRes.error)!.message}`)
        setLoading(false)
        return
      }

      const agents = (aRes.data || []) as Agent[]
      const convs = (cRes.data || []) as Conv[]
      const openNowMap: Record<string, number> = {}
      ;(openRes.data || []).forEach((c: any) => {
        openNowMap[c.assigned_agent_id] = (openNowMap[c.assigned_agent_id] || 0) + 1
      })

      const fromMs = new Date(p.fromIso).getTime()
      const toMs = new Date(p.toIso).getTime()

      const rows: AgentStats[] = agents.map(a => {
        const mine = convs.filter(c => c.assigned_agent_id === a.id)
        const handled = mine.filter(c => {
          const t = new Date(c.created_at).getTime()
          return t >= fromMs && t <= toMs
        }).length
        const resolvedConvs = mine.filter(c => {
          if (!c.resolved_at) return false
          const t = new Date(c.resolved_at).getTime()
          return t >= fromMs && t <= toMs
        })
        const avgHandleMin = resolvedConvs.length > 0
          ? Math.round(resolvedConvs.reduce((s, c) =>
              s + (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()) / 60000, 0) / resolvedConvs.length)
          : 0
        // Score: resolution volume + rate, penalized slightly by handling time
        const rate = handled > 0 ? resolvedConvs.length / handled : (resolvedConvs.length > 0 ? 1 : 0)
        const score = Math.min(100, Math.round(rate * 70 + Math.min(resolvedConvs.length, 30)))
        return {
          id: a.id, name: a.name, status: a.status,
          handled, resolved: resolvedConvs.length, openNow: openNowMap[a.id] || 0,
          avgHandleMin, score,
        }
      }).sort((x, y) => y.resolved - x.resolved || y.handled - x.handled)

      setStats(rows)
      setLoading(false)
    }
    run()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.fromIso, p.toIso])

  const formatMin = (m: number) => m === 0 ? '—' : m < 60 ? `${m}min` : `${Math.floor(m / 60)}h ${m % 60}m`
  const topResolved = stats.length > 0 ? Math.max(...stats.map(s => s.resolved)) : 0

  const exportReport = () => {
    downloadCSV(`agent-performance-${new Date().toISOString().slice(0, 10)}`,
      ['Agent', 'Status', 'Handled', 'Resolved', 'Open Now', 'Avg Handling (min)', 'Score'],
      stats.map(s => [s.name, s.status, s.handled, s.resolved, s.openNow, s.avgHandleMin, s.score]))
    showToast('success', 'Report exported')
  }

  const statusDot = (s: string) =>
    s === 'online' ? 'bg-green-500' : s === 'busy' ? 'bg-yellow-500' : s === 'away' ? 'bg-orange-400' : 'bg-gray-300'

  return (
    <div className="p-8 space-y-6">
      <Toasts toasts={toasts} dismiss={dismissToast} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agent Performance</h1>
            <p className="text-gray-500 mt-1">Individual agent metrics · {p.label}</p>
          </div>
        </div>
        <button onClick={exportReport} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#00B69B' }}>
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <PeriodFilter {...p.bind} />

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-200" style={{ backgroundColor: '#EDFDF8' }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Agent</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Handled</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Resolved</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Open Now</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Avg. Handling</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400"><RefreshCw className="w-5 h-5 animate-spin inline mr-2" /> Calculating performance...</td></tr>
            ) : stats.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400">No active agents found</td></tr>
            ) : stats.map(s => (
              <tr key={s.id} className="hover:bg-emerald-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#00B69B' }}>
                        {s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusDot(s.status)}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{s.name}</span>
                      {s.resolved === topResolved && topResolved > 0 && (
                        <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Top
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">{s.handled}</td>
                <td className="px-6 py-4 text-sm text-right font-medium text-[#00B69B]">{s.resolved}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-600">{s.openNow}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-600">{formatMin(s.avgHandleMin)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.score}%`, backgroundColor: s.score >= 70 ? '#00B69B' : s.score >= 40 ? '#F59E0B' : '#EF4444' }} />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8">{s.score}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        Handled = conversations assigned to the agent and created in the period · Resolved = conversations the agent resolved in the period ·
        Score = resolution rate (70%) + resolution volume (30%)
      </p>
    </div>
  )
}
