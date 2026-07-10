'use client'

import { useState, useEffect } from 'react'
import { MoreVertical, Edit, KeyRound, UserX, Trash2, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface Agent {
  id: string
  name: string
  email: string
  role: 'admin' | 'agent'
  status: 'online' | 'busy' | 'away' | 'offline'
  is_active: boolean
  max_chats: number
  created_at: string
}

const statusConfig: Record<string, { dot: string; label: string; bg: string; text: string }> = {
  online:  { dot: 'bg-green-500',  label: 'Online',  bg: 'bg-green-100',  text: 'text-green-800' },
  busy:    { dot: 'bg-yellow-500', label: 'Busy',    bg: 'bg-yellow-100', text: 'text-yellow-800' },
  away:    { dot: 'bg-gray-400',   label: 'Away',    bg: 'bg-gray-100',   text: 'text-gray-700' },
  offline: { dot: 'bg-red-500',    label: 'Offline', bg: 'bg-red-100',    text: 'text-red-800' },
}

const avatarColors = ['#C0992F', '#00B69B', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B']

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getColor(index: number) {
  return avatarColors[index % avatarColors.length]
}

export function AgentTable() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const fetchAgents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('role', { ascending: false })
      .order('name')

    if (!error && data) {
      setAgents(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  const counts = {
    total: agents.length,
    online: agents.filter(a => a.status === 'online').length,
    busy: agents.filter(a => a.status === 'busy').length,
    away: agents.filter(a => a.status === 'away').length,
    offline: agents.filter(a => a.status === 'offline').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Loading agents...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm">
          Total: {counts.total}
        </span>
        <span className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Online: {counts.online}
        </span>
        <span className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Busy: {counts.busy}
        </span>
        <span className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> Away: {counts.away}
        </span>
        <span className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Offline: {counts.offline}
        </span>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Max Chats</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agents.map((agent, index) => {
              const status = statusConfig[agent.status] || statusConfig.offline
              return (
                <tr
                  key={agent.id}
                  className="hover:bg-amber-50 transition-colors"
                  onClick={() => setOpenMenuId(null)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                        style={{ backgroundColor: getColor(index) }}
                      >
                        {getInitials(agent.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{agent.name}</p>
                        <p className="text-xs text-gray-500">{agent.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-semibold',
                      agent.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-700'
                    )}>
                      {agent.role === 'admin' ? 'Admin' : 'Agent'}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className={cn('flex items-center gap-1.5 text-xs font-medium w-fit px-2.5 py-1 rounded-full', status.bg, status.text)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                      {status.label}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{agent.max_chats}</span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {new Date(agent.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>

                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Edit
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === agent.id ? null : agent.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        {openMenuId === agent.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              <Edit className="w-4 h-4" /> Change Role
                            </button>
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              <KeyRound className="w-4 h-4" /> Reset Password
                            </button>
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-yellow-600 hover:bg-yellow-50 transition-colors">
                              <UserX className="w-4 h-4" /> Deactivate
                            </button>
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100">
                              <Trash2 className="w-4 h-4" /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
