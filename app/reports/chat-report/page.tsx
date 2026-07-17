'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, RefreshCw, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePeriod, PeriodFilter } from '@/components/period-filter'
import { downloadCSV } from '@/lib/report-utils'
import { useToasts, Toasts } from '@/components/ui/toasts'

interface TopConv {
  id: string
  status: string
  message_count: number
  created_at: string
  resolved_at: string | null
  contacts: { name: string; phone: string } | null
  agents: { name: string } | null
}

export default function ChatReportPage() {
  const p = usePeriod('today')
  const { toasts, showToast, dismissToast } = useToasts()
  const [hourly, setHourly] = useState<{ hour: string; conversations: number }[]>([])
  const [topConvs, setTopConvs] = useState<TopConv[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      const [volRes, topRes] = await Promise.all([
        supabase
          .from('conversations')
          .select('created_at')
          .gte('created_at', p.fromIso)
          .lte('created_at', p.toIso)
          .limit(20000),
        supabase
          .from('conversations')
          .select('id, status, message_count, created_at, resolved_at, contacts(name, phone), agents:assigned_agent_id(name)')
          .gte('created_at', p.fromIso)
          .lte('created_at', p.toIso)
          .order('message_count', { ascending: false })
          .limit(10),
      ])
      if (cancelled) return
      if (volRes.error) showToast('error', `Failed to load report: ${volRes.error.message}`)

      const created = (volRes.data || []).map(c => new Date(c.created_at))
      setTotal(created.length)

      // Bucket by hour of day (0-23) across the whole period
      const buckets = Array.from({ length: 24 }, (_, h) => ({
        hour: `${String(h).padStart(2, '0')}:00`,
        conversations: created.filter(d => d.getHours() === h).length,
      }))
      setHourly(buckets)
      setTopConvs((topRes.data as any) || [])
      setLoading(false)
    }
    run()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.fromIso, p.toIso])

  const maxVal = Math.max(...hourly.map(d => d.conversations), 1)
  const peakHour = hourly.reduce((best, h) => h.conversations > best.conversations ? h : best, hourly[0] || { hour: '—', conversations: 0 })

  const duration = (c: TopConv) => {
    if (!c.resolved_at) return '—'
    const mins = Math.round((new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime()) / 60000)
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  const exportReport = () => {
    downloadCSV(`chat-report-${new Date().toISOString().slice(0, 10)}`,
      ['Hour', 'Conversations'],
      hourly.map(h => [h.hour, h.conversations]))
    showToast('success', 'Report exported')
  }

  return (
    <div className="p-8 space-y-6">
      <Toasts toasts={toasts} dismiss={dismissToast} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chat Report</h1>
            <p className="text-gray-500 mt-1">Conversation volume and analytics · {p.label}</p>
          </div>
        </div>
        <button onClick={exportReport} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#00B69B' }}>
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <PeriodFilter {...p.bind} />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-400 mb-1">Total Conversations</p>
          <p className="text-2xl font-bold text-gray-900">{loading ? '—' : total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-400 mb-1">Peak Hour</p>
          <p className="text-2xl font-bold text-gray-900">{loading || total === 0 ? '—' : `${peakHour.hour} · ${peakHour.conversations} chats`}</p>
        </div>
      </div>

      {/* Hourly Volume Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-gray-900">Conversation Volume by Hour of Day</h2>
          {loading && <RefreshCw className="w-4 h-4 animate-spin text-gray-300" />}
        </div>
        {!loading && total === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No conversations in this period</p>
        ) : (
          <>
            <div className="flex items-end gap-[3px]" style={{ height: '256px' }}>
              {hourly.map((data, idx) => {
                const barHeight = (data.conversations / maxVal) * 230
                const isPeak = data.hour === peakHour.hour && data.conversations > 0
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full rounded-t-sm hover:opacity-80 cursor-pointer transition-opacity"
                      style={{
                        height: `${Math.max(barHeight, data.conversations > 0 ? 4 : 1)}px`,
                        backgroundColor: isPeak ? '#C0992F' : '#00B69B',
                        opacity: data.conversations === 0 ? 0.15 : 1,
                      }}
                      title={`${data.hour}: ${data.conversations} conversations`}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-3">
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
            </div>
          </>
        )}
      </div>

      {/* Top Conversations */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#00B69B]" />
          <h2 className="font-semibold text-gray-900">Top 10 Conversations by Message Count</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Messages</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400"><RefreshCw className="w-5 h-5 animate-spin inline mr-2" /> Loading...</td></tr>
            ) : topConvs.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No conversations in this period</td></tr>
            ) : topConvs.map(c => (
              <tr key={c.id} className="hover:bg-emerald-50/50 transition-colors">
                <td className="px-6 py-3.5">
                  <p className="text-sm font-medium text-gray-900">{c.contacts?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-400" dir="ltr">{c.contacts?.phone || '—'}</p>
                </td>
                <td className="px-6 py-3.5 text-sm text-gray-600">{c.agents?.name || <span className="text-yellow-600 text-xs bg-yellow-50 px-2 py-0.5 rounded-full">Unassigned</span>}</td>
                <td className="px-6 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.status === 'open' ? 'bg-blue-100 text-blue-700'
                    : c.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                    : c.status === 'resolved' ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                  }`}>{c.status}</span>
                </td>
                <td className="px-6 py-3.5 text-sm text-right font-bold text-gray-900">{c.message_count ?? 0}</td>
                <td className="px-6 py-3.5 text-sm text-right text-gray-600">{duration(c)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
