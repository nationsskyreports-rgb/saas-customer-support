'use client'

import { useState, useEffect } from 'react'
import { MoreVertical, Edit, KeyRound, UserX, Trash2, RefreshCw, X, Save } from 'lucide-react'
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
  const [editAgent, setEditAgent] = useState<Agent | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<'admin' | 'agent'>('agent')
  const [editMaxChats, setEditMaxChats] = useState(5)
  const [editStatus, setEditStatus] = useState<'online' | 'busy' | 'away' | 'offline'>('online')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchAgents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('role', { ascending: false })
      .order('name')

    if (!error && data) setAgents(data)
    setLoading(false)
  }

  useEffect(() => { fetchAgents() }, [])

  const counts = {
    total: agents.length,
    online: agents.filter(a => a.status === 'online').length,
    busy: agents.filter(a => a.status === 'busy').length,
    away: agents.filter(a => a.status === 'away').length,
    offline: agents.filter(a => a.status === 'offline').length,
  }

  // ─── EDIT ────────────────────────────────────
  const openEdit = (agent: Agent) => {
    setEditAgent(agent)
    setEditName(agent.name)
    setEditRole(agent.role)
    setEditMaxChats(agent.max_chats)
    setEditStatus(agent.status)
    setOpenMenuId(null)
  }

  const saveEdit = async () => {
    if (!editAgent) return
    setSaving(true)
    await supabase.from('agents').update({
      name: editName,
      role: editRole,
      max_chats: editMaxChats,
      status: editStatus,
    }).eq('id', editAgent.id)
    setSaving(false)
    setEditAgent(null)
    fetchAgents()
  }

  // ─── CHANGE ROLE ─────────────────────────────
  const changeRole = async (agent: Agent) => {
    const newRole = agent.role === 'admin' ? 'agent' : 'admin'
    await supabase.from('agents').update({ role: newRole }).eq('id', agent.id)
    setOpenMenuId(null)
    fetchAgents()
  }

  // ─── DEACTIVATE ──────────────────────────────
  const toggleActive = async (agent: Agent) => {
    await supabase.from('agents').update({
      is_active: !agent.is_active,
      status: !agent.is_active ? 'offline' : agent.status,
    }).eq('id', agent.id)
    setOpenMenuId(null)
    fetchAgents()
  }

  // ─── DELETE ──────────────────────────────────
  const deleteAgent = async (id: string) => {
    await supabase.from('agent_teams').delete().eq('agent_id', id)
    await supabase.from('agent_groups').delete().eq('agent_id', id)
    await supabase.from('agents').delete().eq('id', id)
    setConfirmDelete(null)
    setOpenMenuId(null)
    fetchAgents()
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
        <span className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm">Total: {counts.total}</span>
        <span className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> Online: {counts.online}</span>
        <span className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Busy: {counts.busy}</span>
        <span className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" /> Away: {counts.away}</span>
        <span className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Offline: {counts.offline}</span>
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
                <tr key={agent.id} className={cn('transition-colors', agent.is_active ? 'hover:bg-amber-50' : 'opacity-50 bg-gray-50')}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0" style={{ backgroundColor: getColor(index) }}>
                        {getInitials(agent.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{agent.name}</p>
                        <p className="text-xs text-gray-500">{agent.email}</p>
                        {!agent.is_active && <span className="text-xs text-red-500 font-medium">Deactivated</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', agent.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700')}>
                      {agent.role === 'admin' ? 'Admin' : 'Agent'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('flex items-center gap-1.5 text-xs font-medium w-fit px-2.5 py-1 rounded-full', status.bg, status.text)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-gray-900">{agent.max_chats}</span></td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{new Date(agent.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(agent)} className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Edit</button>
                      <div className="relative">
                        <button onClick={() => setOpenMenuId(openMenuId === agent.id ? null : agent.id)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        {openMenuId === agent.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                            <button onClick={() => changeRole(agent)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                              <Edit className="w-4 h-4" /> Make {agent.role === 'admin' ? 'Agent' : 'Admin'}
                            </button>
                            <button onClick={() => toggleActive(agent)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-yellow-600 hover:bg-yellow-50">
                              <UserX className="w-4 h-4" /> {agent.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button onClick={() => { setConfirmDelete(agent.id); setOpenMenuId(null) }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100">
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

      {/* ─── EDIT DRAWER ─────────────────────────── */}
      {editAgent && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setEditAgent(null)}>
          <div className="w-96 h-full bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Edit Agent</h2>
              <button onClick={() => setEditAgent(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl" style={{ backgroundColor: '#C0992F' }}>
                  {getInitials(editName)}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>

              {/* Email (readonly) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input type="text" value={editAgent.email} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value as 'admin' | 'agent')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300">
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300">
                  <option value="online">🟢 Online</option>
                  <option value="busy">🟡 Busy</option>
                  <option value="away">⚫ Away</option>
                  <option value="offline">🔴 Offline</option>
                </select>
              </div>

              {/* Max Chats */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Concurrent Chats</label>
                <input type="number" value={editMaxChats} onChange={e => setEditMaxChats(Number(e.target.value))} min={1} max={20} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button onClick={() => setEditAgent(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ backgroundColor: '#C0992F' }}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM ──────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Agent?</h3>
            <p className="text-sm text-gray-500 mb-6">This will permanently delete this agent. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteAgent(confirmDelete)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
