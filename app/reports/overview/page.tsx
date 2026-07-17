'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Download, ArrowLeft, RefreshCw, MessageCircle, CheckCircle2, Timer, Users } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from '@/lib/supabase'
import { usePeriod, PeriodFilter } from '@/components/period-filter'
import { downloadCSV } from '@/lib/report-utils'
import { useToasts, Toasts } from '@/components/ui/toasts'

interface Conv { created_at: string; resolved_at: string | null; status: string; assigned_agent_id: string | null }
interface DayPoint { date: string; conversations: number; resolved: number }

const DAY = 24 * 60 * 60 * 1000
const STATUS_COLORS: Record<string, string> = {
  open: '#3B82F6', pending: '#F59E0B', resolved: '#00B69B', closed: '#9CA3AF',
}

export default function OverviewReportPage() {
  const p = usePeriod('7d')
  const { toasts, showToast, dismissToast } = useToasts()
  const [convs, setConvs] = useState<Conv[]>([])
  const [agentCount, setAgentCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      const [cRes, aRes] = await Promise.all([
        supabase
          .from('conversations')
          .select('created_at, resolved_at, status, assigned_agent_id')
          .or(`and(created_at.gte.${p.fromIso},created_at.lte.${p.toIso}),and(resolved_at.gte.${p.fromIso},resolved_at.lte.${p.toIso})`)
          .limit(20000),
        supabase.from('agents').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ])
      if (cancelled) return
      if (cRes.error) showToast('error', `Failed to load report: ${cRes.error.message}`)
      setConvs((cRes.data as any) || [])
      setAgentCount(aRes.count || 0)
      setLoading(false)
    }
    run()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.fromIso, p.toIso])

  const fromMs = new Date(p.fromIso).getTime()
  const toMs = new Date(p.toIso).getTime()

  const createdInPeriod = convs.filter(c => {
    const t = new Date(c.created_at).getTime()
    return t >= fromMs && t <= toMs
  })
  const resolvedInPeriod = convs.filter(c => {
    if (!c.resolved_at) return false
    const t = new Date(c.resolved_at).getTime()
    return t >= fromMs && t <= toMs
  })
  const resolutionRate = createdInPeriod.length > 0
    ? Math.round((resolvedInPeriod.length / createdInPeriod.length) * 100)
    : 0
  const avgHandlingMin = resolvedInPeriod.length > 0
    ? Math.round(resolvedInPeriod.reduce((s, c) =>
        s + (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()) / 60000, 0) / resolvedInPeriod.length)
    : 0
  const formatMin = (m: number) => m < 60 ? `${m}min` : `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}m` : ''}`.trim()

  // ── Daily trend (bucketed) ──
  const bucketCount = Math.min(Math.max(1, Math.ceil((toMs - fromMs) / DAY)), 92)
  const daily: DayPoint[] = []
  for (let i = 0; i < bucketCount; i++) {
    const bStart = new Date(fromMs + i * DAY); bStart.setHours(0, 0, 0, 0)
    const s = bStart.getTime(), e = s + DAY
    daily.push({
      date: bStart.toLocaleDateString('en-US', bucketCount > 10 ? { month: 'short', day: 'numeric' } : { weekday: 'short', day: 'numeric' }),
      conversations: createdInPeriod.filter(c => { const t = new Date(c.created_at).getTime(); return t >= s && t < e }).length,
      resolved: resolvedInPeriod.filter(c => { const t = new Date(c.resolved_at!).getTime(); return t >= s && t < e }).length,
    })
  }

  // ── Status breakdown (of conversations created in the period) ──
  const statusData = ['open', 'pending', 'resolved', 'closed'].map(s => ({
    status: s.charAt(0).toUpperCase() + s.slice(1),
    count: createdInPeriod.filter(c => c.status === s).length,
    fill: STATUS_COLORS[s],
  })).filter(d => d.count > 0)

  const exportReport = () => {
    downloadCSV(`overview-report-${new Date().toISOString().slice(0, 10)}`,
      ['Date', 'New Conversations', 'Resolved'],
      daily.map(d => [d.date, d.conversations, d.resolved]))
    showToast('success', 'Report exported')
  }

  const kpis = [
    { label: 'Total Conversations', value: createdInPeriod.length.toLocaleString(), icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Resolved', value: resolvedInPeriod.length.toLocaleString(), sub: `${resolutionRate}% resolution rate`, icon: CheckCircle2, color: 'text-[#00B69B]', bg: 'bg-emerald-50' },
    { label: 'Avg. Handling Time', value: resolvedInPeriod.length ? formatMin(avgHandlingMin) : '—', icon: Timer, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Active Agents', value: agentCount, icon: Users, color: 'text-amber-500', bg: 'bg-amber-50' },
  ]

  return (
    <div className="p-8 space-y-6">
      <Toasts toasts={toasts} dismiss={dismissToast} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Overview Report</h1>
            <p className="text-gray-500 mt-1">Live platform metrics · {p.label}</p>
          </div>
        </div>
        <button onClick={exportReport} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#00B69B' }}>
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <PeriodFilter {...p.bind} />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="bg-white rounded-xl p-5 border border-gray-200">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${k.color}`} />
              </div>
              <p className="text-sm text-gray-400 mb-1">{k.label}</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : k.value}</p>
              {k.sub && !loading && <p className="text-xs text-[#00B69B] font-semibold mt-1">{k.sub}</p>}
            </div>
          )
        })}
      </div>

      {/* Daily Trend */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-gray-900">Conversations Trend</h2>
          {loading && <RefreshCw className="w-4 h-4 animate-spin text-gray-300" />}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid #E5E7EB' }} />
            <Legend />
            <Line type="monotone" dataKey="conversations" name="New" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#00B69B" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-6">Status Breakdown <span className="text-xs font-normal text-gray-400">(conversations created in period)</span></h2>
        {statusData.length === 0 && !loading ? (
          <p className="text-sm text-gray-400 text-center py-10">No conversations in this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="status" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid #E5E7EB' }} />
              <Bar dataKey="count" name="Conversations" radius={[6, 6, 0, 0]}>
                {statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
