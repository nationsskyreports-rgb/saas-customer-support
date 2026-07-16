'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageCircle, Users, AlertTriangle, ChevronRight,
  CheckCircle2, Inbox, RefreshCw, Clock, Star, Timer
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MetricsChart } from '@/components/metrics-chart'

interface Agent {
  id: string; name: string; status: string; max_chats: number; is_active: boolean
}
interface Conversation {
  id: string; status: string; assigned_agent_id: string | null
  last_message_at: string | null; updated_at: string; created_at: string
  resolved_at?: string | null; contacts: { name: string; phone: string } | null
}

const STALE_MS = 30 * 60 * 1000

type Period = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom'

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  month: 'This Month',
  custom: 'Custom',
}

function getPeriodRange(period: Period, customFrom: string, customTo: string): { from: Date; to: Date } {
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

export default function DashboardPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [openConvs, setOpenConvs] = useState<Conversation[]>([])
  const [resolvedToday, setResolvedToday] = useState(0)
  const [resolvedConvsToday, setResolvedConvsToday] = useState<Conversation[]>([])
  const [todayConversations, setTodayConversations] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // ─── Period filter ───
  const [period, setPeriod] = useState<Period>('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const periodLabel = period === 'custom' && customFrom
    ? `${customFrom} → ${customTo || 'today'}`
    : PERIOD_LABELS[period]

  const fetchData = useCallback(async () => {
    setLoading(true) // ← هذا يصلح زر Refresh
    const { from, to } = getPeriodRange(period, customFrom, customTo)

    const [aRes, cRes, resolvedRes, todayCountRes, resolvedDetailRes] = await Promise.all([
      supabase.from('agents').select('*').eq('is_active', true).order('status').order('name'),
      supabase.from('conversations')
        .select('id, status, assigned_agent_id, last_message_at, updated_at, created_at, contacts(name, phone)')
        .in('status', ['open', 'pending'])
        .order('updated_at', { ascending: true }),
      supabase.from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .gte('resolved_at', from.toISOString())
        .lte('resolved_at', to.toISOString()),
      supabase.from('conversations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString()),
      supabase.from('conversations')
        .select('created_at, resolved_at')
        .eq('status', 'resolved')
        .gte('resolved_at', from.toISOString())
        .lte('resolved_at', to.toISOString())
        .not('resolved_at', 'is', null),
    ])

    if (aRes.data) setAgents(aRes.data)
    if (cRes.data) setOpenConvs(cRes.data as any)
    setResolvedToday(resolvedRes.count || 0)
    setTodayConversations(todayCountRes.count || 0)
    if (resolvedDetailRes.data) setResolvedConvsToday(resolvedDetailRes.data as any)
    setLoading(false)
    setLastRefresh(new Date())
  }, [period, customFrom, customTo])

  useEffect(() => {
    fetchData()
    const ch = supabase
      .channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchData])

  const now = Date.now()
  const onlineAgents = agents.filter(a => a.status === 'online')
  const staleConvs = openConvs.filter(c => {
    const lastActivity = c.last_message_at || c.updated_at
    return now - new Date(lastActivity).getTime() > STALE_MS
  })
  const unassigned = openConvs.filter(c => !c.assigned_agent_id)

  const agentChatMap: Record<string, number> = {}
  openConvs.forEach(c => {
    if (c.assigned_agent_id)
      agentChatMap[c.assigned_agent_id] = (agentChatMap[c.assigned_agent_id] || 0) + 1
  })

  // Avg Handling Time من resolved conversations النهارده
  const avgHandlingMin = resolvedConvsToday.length > 0
    ? Math.round(
        resolvedConvsToday.reduce((sum, c) => {
          if (!c.resolved_at) return sum
          return sum + (new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime()) / 60000
        }, 0) / resolvedConvsToday.length
      )
    : 0

  // Avg Response Time = متوسط عمر الشاتس المفتوحة (approximate)
  const avgResponseMin = openConvs.length > 0
    ? Math.round(
        openConvs.reduce((sum, c) => sum + (now - new Date(c.created_at).getTime()) / 60000, 0)
        / openConvs.length
      )
    : 0

  const formatMin = (m: number) => {
    if (m === 0) return '0min'
    if (m < 60) return `${m}min`
    const h = Math.floor(m / 60), rem = m % 60
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`
  }

  const waitTime = (ts: string) => {
    const mins = Math.floor((now - new Date(ts).getTime()) / 60000)
    if (mins < 60) return `${mins}m`
    const h = Math.floor(mins / 60), m = mins % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  const statusDot = (s: string) => {
    switch (s) {
      case 'online': return 'bg-green-500'
      case 'busy':   return 'bg-yellow-500'
      case 'away':   return 'bg-orange-400'
      default:       return 'bg-gray-300'
    }
  }

  const statusLabel = (s: string) => {
    switch (s) {
      case 'online': return { text: 'Online', cls: 'text-green-600' }
      case 'busy':   return { text: 'Busy',   cls: 'text-yellow-600' }
      case 'away':   return { text: 'Away',   cls: 'text-orange-500' }
      default:       return { text: 'Offline', cls: 'text-gray-400' }
    }
  }

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Live · Updated {lastRefresh.toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit' })} · Showing: <span className="font-semibold text-gray-500">{periodLabel}</span>
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00B69B]' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-2 flex-wrap">
        {(['today', 'yesterday', '7d', '30d', 'month', 'custom'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              period === p
                ? 'text-white'
                : 'text-gray-500 bg-gray-50 hover:bg-gray-100'
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <button onClick={() => router.push('/inbox/all')}
          className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-[#00B69B] hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[#00B69B]" />
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#00B69B] transition-colors" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '—' : todayConversations}
          </p>
          <p className="text-xs text-gray-400 mt-1">Conversations · {periodLabel}</p>
        </button>

        <button onClick={() => router.push('/monitoring')}
          className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-[#00B69B] hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#00B69B]" />
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#00B69B] transition-colors" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '—' : onlineAgents.length}
            <span className="text-sm font-normal text-gray-400"> / {agents.length}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Online Agents</p>
        </button>

        <button onClick={() => router.push('/inbox/all?tab=open')}
          className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-blue-400 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-blue-500" />
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '—' : openConvs.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Open / Pending</p>
        </button>

        <button onClick={() => router.push('/inbox/all?tab=open')}
          className={`rounded-xl border p-5 text-left hover:shadow-md transition-all group ${
            staleConvs.length > 0
              ? 'bg-red-50 border-red-300 hover:border-red-500'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              staleConvs.length > 0 ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${staleConvs.length > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
            {staleConvs.length > 0 && (
              <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full animate-pulse">
                URGENT
              </span>
            )}
          </div>
          <p className={`text-2xl font-bold ${staleConvs.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {loading ? '—' : staleConvs.length}
          </p>
          <p className={`text-xs mt-1 ${staleConvs.length > 0 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            No reply +30min
          </p>
        </button>
      </div>

      {/* Avg Response + Avg Handling */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-[#00B69B]/40 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-[#00B69B]" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Avg. Response Time</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {loading ? '—' : formatMin(avgResponseMin)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Based on {openConvs.length} open conversations</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Timer className="w-6 h-6 text-[#00B69B]" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Avg. Handling Time</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {loading ? '—' : formatMin(avgHandlingMin)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">From {resolvedConvsToday.length} resolved · {periodLabel}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Agent Roster + Stale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Agent Live Roster */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm">Agent Status</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-600 font-medium">Live</span>
            </div>
          </div>
          <div className="flex-1 divide-y divide-gray-50">
            {agents.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No agents found</p>
            )}
            {agents.map(agent => {
              const chatCount = agentChatMap[agent.id] || 0
              const atCapacity = chatCount >= agent.max_chats && agent.max_chats > 0
              const { text: sLabel, cls: sColor } = statusLabel(agent.status)
              return (
                <button key={agent.id} onClick={() => router.push('/monitoring')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50/60 transition-colors text-left">
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: '#00B69B' }}>
                      {initials(agent.name)}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusDot(agent.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{agent.name}</p>
                    <p className={`text-xs ${sColor}`}>{sLabel}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {chatCount > 0 ? (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        atCapacity ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {chatCount} chat{chatCount !== 1 ? 's' : ''}{atCapacity ? ' 🔴' : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 font-medium">idle</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          {unassigned.length > 0 && (
            <div onClick={() => router.push('/inbox/all?tab=open')}
              className="mx-3 mb-3 mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors">
              <p className="text-xs font-semibold text-yellow-700">
                ⚡ {unassigned.length} unassigned {unassigned.length === 1 ? 'chat' : 'chats'} in queue
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">Tap to assign →</p>
            </div>
          )}
        </div>

        {/* Stale Conversations */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900 text-sm">Stale Conversations</h2>
              {staleConvs.length > 0 && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                  {staleConvs.length} need attention
                </span>
              )}
            </div>
            <button onClick={() => router.push('/inbox/all?tab=open')}
              className="text-xs text-[#00B69B] hover:underline font-medium">
              View all →
            </button>
          </div>
          {staleConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-gray-400">
              <CheckCircle2 className="w-10 h-10 mb-3 text-green-400" />
              <p className="text-sm font-semibold text-gray-600">All caught up!</p>
              <p className="text-xs mt-1">No conversations waiting over 30 minutes</p>
            </div>
          ) : (
            <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
              <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <span className="col-span-4">Contact</span>
                <span className="col-span-3">Assigned To</span>
                <span className="col-span-2">Status</span>
                <span className="col-span-2 text-right">Waiting</span>
                <span className="col-span-1" />
              </div>
              {staleConvs.map(c => {
                const contact = c.contacts as any
                const lastActivity = c.last_message_at || c.updated_at
                const mins = Math.floor((now - new Date(lastActivity).getTime()) / 60000)
                const isUrgent = mins >= 60
                const assignedAgent = agents.find(a => a.id === c.assigned_agent_id)
                return (
                  <button key={c.id} onClick={() => router.push('/inbox/all?tab=open')}
                    className="w-full grid grid-cols-12 gap-2 items-center px-5 py-3.5 hover:bg-red-50 transition-colors text-left group">
                    <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                        isUrgent ? 'bg-red-500' : 'bg-orange-400'
                      }`}>
                        {(contact?.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{contact?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400 truncate">{contact?.phone || '—'}</p>
                      </div>
                    </div>
                    <div className="col-span-3 min-w-0">
                      {assignedAgent ? (
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot(assignedAgent.status)}`} />
                          <span className="text-xs text-gray-600 truncate">{assignedAgent.name.split(' ')[0]}</span>
                        </div>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Unassigned</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.status === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{c.status}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className={`text-sm font-bold ${isUrgent ? 'text-red-600' : 'text-orange-500'}`}>
                        {waitTime(lastActivity)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Chart */}
      <MetricsChart />

      {/* Resolved Today */}
      <div className="bg-gradient-to-r from-[#00B69B]/10 via-white to-[#00B69B]/10 border border-[#00B69B]/20 rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Resolved · {periodLabel}</p>
          <p className="text-3xl font-bold mt-0.5" style={{ color: '#00B69B' }}>
            {loading ? '—' : resolvedToday}
            <span className="text-base font-normal text-gray-400 ml-2">conversations closed</span>
          </p>
        </div>
        <Star className="w-12 h-12 opacity-15" style={{ color: '#00B69B' }} />
      </div>

    </div>
  )
}
