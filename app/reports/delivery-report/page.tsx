'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Send, CheckCircle, Eye, AlertCircle, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePeriod, PeriodFilter } from '@/components/period-filter'
import { downloadCSV } from '@/lib/report-utils'
import { useToasts, Toasts } from '@/components/ui/toasts'

interface Msg { created_at: string; status: string | null }

const DAY = 24 * 60 * 60 * 1000

export default function DeliveryReportPage() {
  const p = usePeriod('7d')
  const { toasts, showToast, dismissToast } = useToasts()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select('created_at, status')
        .eq('direction', 'outbound')
        .gte('created_at', p.fromIso)
        .lte('created_at', p.toIso)
        .limit(50000)
      if (cancelled) return
      if (error) showToast('error', `Failed to load report: ${error.message}`)
      setMsgs((data as any) || [])
      setLoading(false)
    }
    run()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.fromIso, p.toIso])

  const count = (s: string) => msgs.filter(m => (m.status || 'sent') === s).length
  const sent = msgs.length
  const delivered = count('delivered') + count('read') // read implies delivered
  const read = count('read')
  const failed = count('failed')
  const pct = (n: number) => sent > 0 ? `${((n / sent) * 100).toFixed(1)}%` : '—'

  const stats = [
    { label: 'Sent (outbound)', value: sent.toLocaleString(), icon: Send, color: 'text-blue-500' },
    { label: 'Delivered', value: delivered.toLocaleString(), subtitle: pct(delivered), icon: CheckCircle, color: 'text-green-500' },
    { label: 'Read', value: read.toLocaleString(), subtitle: pct(read), icon: Eye, color: 'text-purple-500' },
    { label: 'Failed', value: failed.toLocaleString(), subtitle: pct(failed), icon: AlertCircle, color: 'text-red-500' },
  ]

  // Daily breakdown
  const fromMs = new Date(p.fromIso).getTime()
  const toMs = new Date(p.toIso).getTime()
  const bucketCount = Math.min(Math.max(1, Math.ceil((toMs - fromMs) / DAY)), 92)
  const daily = Array.from({ length: bucketCount }, (_, i) => {
    const d = new Date(fromMs + i * DAY); d.setHours(0, 0, 0, 0)
    const s = d.getTime(), e = s + DAY
    const inDay = msgs.filter(m => { const t = new Date(m.created_at).getTime(); return t >= s && t < e })
    const dRead = inDay.filter(m => m.status === 'read').length
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      sent: inDay.length,
      delivered: inDay.filter(m => m.status === 'delivered').length + dRead,
      read: dRead,
      failed: inDay.filter(m => m.status === 'failed').length,
    }
  }).reverse()

  const exportReport = () => {
    downloadCSV(`delivery-report-${new Date().toISOString().slice(0, 10)}`,
      ['Date', 'Sent', 'Delivered', 'Read', 'Failed'],
      daily.map(d => [d.date, d.sent, d.delivered, d.read, d.failed]))
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
            <h1 className="text-3xl font-bold text-gray-900">Delivery Report</h1>
            <p className="text-gray-500 mt-1">Outbound message delivery statistics · {p.label}</p>
          </div>
        </div>
        <button onClick={exportReport} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#00B69B' }}>
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <PeriodFilter {...p.bind} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-6">
              <Icon className={`w-8 h-8 ${stat.color} mb-4`} />
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : stat.value}</p>
              {stat.subtitle && !loading && <p className="text-xs text-[#00B69B] font-semibold mt-1">{stat.subtitle}</p>}
            </div>
          )
        })}
      </div>

      {/* Daily Breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Daily Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200" style={{ backgroundColor: '#EDFDF8' }}>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Sent</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Delivered</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Read</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Failed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400"><RefreshCw className="w-5 h-5 animate-spin inline mr-2" /> Loading...</td></tr>
              ) : sent === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No outbound messages in this period</td></tr>
              ) : daily.map((row, idx) => (
                <tr key={idx} className="hover:bg-emerald-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.date}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">{row.sent.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right text-green-600">{row.delivered.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right text-purple-600">{row.read.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right text-red-600">{row.failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Counts are based on the <code>status</code> of outbound messages. Messages currently marked only as "sent" will show as Sent until a
        delivery provider (e.g. WhatsApp Business API) updates their statuses to delivered / read / failed.
      </p>
    </div>
  )
}
