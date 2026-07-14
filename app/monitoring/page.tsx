'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, AlertCircle, Clock, MessageCircle, Phone, TrendingUp, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Agent { id: string; name: string; status: string; max_chats: number; is_active: boolean }
interface Channel { id: string; name: string; type: string; availability: boolean }
interface Conversation { id: string; contact_name: string; contact_phone: string; status: string; agent_id: string | null; created_at: string }
interface LogEntry { id: string; actor: string; action: string; created_at: string }

export default function MonitoringPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activity, setActivity] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const [aRes, chRes, cRes, logRes] = await Promise.all([
      supabase.from('agents').select('*').eq('is_active', true).order('name'),
      supabase.from('channels').select('*').order('created_at'),
      supabase.from('conversations').select('*').in('status', ['open', 'pending']).order('created_at', { ascending: false }),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10),
    ])
    if (aRes.data) setAgents(aRes.data)
    if (chRes.data) setChannels(chRes.data)
    if (cRes.data) setConversations(cRes.data)
    if (logRes.data) setActivity(logRes.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    // Real-time subscriptions
    const ch = supabase
      .channel('monitoring-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => fetchData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, () => fetchData())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const activeConvs = conversations.filter(c => c.status === 'open').length
  const pendingConvs = conversations.filter(c => c.status === 'pending').length
  const onlineAgents = agents.filter(a => a.status === 'online').length
  const unassigned = conversations.filter(c => !c.agent_id)

  const stats = [
    { title: 'Active Conversations', value: activeConvs, icon: MessageCircle, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Pending', value: pendingConvs, icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { title: 'Online Agents', value: onlineAgents, icon: Activity, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'Unassigned', value: unassigned.length, icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  ]

  const getStatusDot = (s: string) => {
    switch (s) {
      case 'online': return 'bg-green-500'
      case 'busy': return 'bg-yellow-500'
      case 'away': return 'bg-gray-400'
      default: return 'bg-red-500'
    }
  }

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /><span className="ml-3 text-gray-500">Loading...</span></div>
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Live Monitoring</h1>
          <p className="text-muted-foreground mt-1">Real-time system status and agent activity</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-600 font-medium">Live</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-2">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}><Icon className={`${stat.color} w-5 h-5`} /></div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Agents */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Agents ({agents.length})</h2>
          <div className="space-y-2">
            {agents.map(agent => (
              <button key={agent.id} onClick={() => router.push(`/agents?agentId=${agent.id}`)} className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#00B69B' }}>
                    {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                    <p className="text-xs text-gray-400">Max: {agent.max_chats} chats</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusDot(agent.status)}`} />
                  <span className="text-xs font-medium text-gray-500 capitalize">{agent.status}</span>
                </div>
              </button>
            ))}
            {agents.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No agents</p>}
          </div>
        </div>

        {/* Channels */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Channels ({channels.length})</h2>
          <div className="space-y-2">
            {channels.map(ch => (
              <button key={ch.id} onClick={() => router.push('/channels')} className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5" style={{ color: '#00B69B' }} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ch.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{ch.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${ch.availability ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={`text-xs font-medium ${ch.availability ? 'text-green-600' : 'text-red-600'}`}>{ch.availability ? 'Active' : 'Inactive'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Queue */}
      {unassigned.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Queue ({unassigned.length} waiting)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-200">
                <th className="text-left text-sm font-semibold text-gray-700 py-3 px-4">Contact</th>
                <th className="text-left text-sm font-semibold text-gray-700 py-3 px-4">Phone</th>
                <th className="text-left text-sm font-semibold text-gray-700 py-3 px-4">Wait Time</th>
                <th className="text-left text-sm font-semibold text-gray-700 py-3 px-4">Status</th>
              </tr></thead>
              <tbody>
                {unassigned.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-emerald-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{c.contact_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{c.contact_phone}</td>
                    <td className="py-3 px-4 text-sm font-medium text-orange-600">{timeAgo(c.created_at)}</td>
                    <td className="py-3 px-4"><span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {activity.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Activity className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.actor}: {log.action}</p>
                  <p className="text-xs text-gray-400">{timeAgo(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
