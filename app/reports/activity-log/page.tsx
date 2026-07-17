'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Search, RefreshCw, Clock, CheckCircle, AlertCircle, LogIn, ArrowRight, Megaphone, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePeriod, PeriodFilter } from '@/components/period-filter'
import { downloadCSV } from '@/lib/report-utils'
import { useToasts, Toasts } from '@/components/ui/toasts'

interface LogRow {
  id: string
  actor: string
  action: string
  entity_type: string | null
  metadata: Record<string, any> | null
  created_at: string
}

function iconFor(action: string, entityType: string | null) {
  const a = (action + ' ' + (entityType || '')).toLowerCase()
  if (a.includes('resolv') || a.includes('clos')) return { Icon: CheckCircle, cls: 'bg-emerald-50 text-[#00B69B]' }
  if (a.includes('login') || a.includes('logged')) return { Icon: LogIn, cls: 'bg-blue-50 text-blue-500' }
  if (a.includes('assign')) return { Icon: ArrowRight, cls: 'bg-purple-50 text-purple-500' }
  if (a.includes('campaign')) return { Icon: Megaphone, cls: 'bg-amber-50 text-amber-500' }
  if (a.includes('agent') || a.includes('creat')) return { Icon: UserPlus, cls: 'bg-teal-50 text-teal-600' }
  if (a.includes('status')) return { Icon: AlertCircle, cls: 'bg-yellow-50 text-yellow-600' }
  return { Icon: Clock, cls: 'bg-gray-100 text-gray-500' }
}

export default function ActivityLogPage() {
  const p = usePeriod('7d')
  const { toasts, showToast, dismissToast } = useToasts()
  const [logs, setLogs] = useState<LogRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('activity_log')
        .select('id, actor, action, entity_type, metadata, created_at')
        .gte('created_at', p.fromIso)
        .lte('created_at', p.toIso)
        .order('created_at', { ascending: false })
        .limit(500)
      if (cancelled) return
      if (error) showToast('error', `Failed to load activity: ${error.message}`)
      setLogs((data as any) || [])
      setLoading(false)
    }
    load()

    const ch = supabase
      .channel('activity-log-report')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, () => load())
      .subscribe()
    return () => { cancelled = true; supabase.removeChannel(ch) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.fromIso, p.toIso])

  const filtered = logs.filter(l => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return l.actor.toLowerCase().includes(s) || l.action.toLowerCase().includes(s) || (l.entity_type || '').toLowerCase().includes(s)
  })

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const metaText = (m: Record<string, any> | null) => {
    if (!m || Object.keys(m).length === 0) return ''
    return Object.entries(m).map(([k, v]) => `${k}: ${v}`).join(' · ')
  }

  const exportReport = () => {
    downloadCSV(`activity-log-${new Date().toISOString().slice(0, 10)}`,
      ['Time', 'Actor', 'Action', 'Entity', 'Details'],
      filtered.map(l => [new Date(l.created_at).toLocaleString(), l.actor, l.action, l.entity_type || '', metaText(l.metadata)]))
    showToast('success', 'Activity log exported')
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
            <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
            <p className="text-gray-500 mt-1">Audit trail of system activity · {p.label} · <span className="text-green-600 font-medium">● Live</span></p>
          </div>
        </div>
        <button onClick={exportReport} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#00B69B' }}>
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <PeriodFilter {...p.bind} />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filter by actor, action, or entity..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400"><RefreshCw className="w-5 h-5 animate-spin inline mr-2" /> Loading activity...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Clock className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">No activity recorded {search ? 'matching your filter' : 'in this period'}</p>
            <p className="text-xs mt-1">Actions like logins, resolutions, and campaign sends are recorded automatically from now on</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(l => {
              const { Icon, cls } = iconFor(l.action, l.entity_type)
              const meta = metaText(l.metadata)
              return (
                <div key={l.id} className="flex items-start gap-4 px-6 py-4 hover:bg-emerald-50/40 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cls}`}>
                    <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{l.actor}</span> {l.action}
                    </p>
                    {meta && <p className="text-xs text-gray-400 mt-0.5 truncate">{meta}</p>}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap" title={new Date(l.created_at).toLocaleString()}>
                    {timeAgo(l.created_at)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
