'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  MoreVertical, Edit, UserX, Trash2, RefreshCw,
  X, Save, Search, Download, Users, Activity, UserMinus
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface AgentTeam { teams: { name: string } | null }
interface Agent {
  id: string
  name: string
  email: string
  mobile_number?: string
  role: string
  status: 'online' | 'busy' | 'away' | 'offline'
  is_active: boolean
  max_chats: number
  created_at: string
  agent_teams?: AgentTeam[]
}

const statusConfig: Record<string, { dot: string; label: string; bg: string; text: string }> = {
  online:  { dot: 'bg-green-500',  label: 'Online',  bg: 'bg-green-100',  text: 'text-green-800' },
  busy:    { dot: 'bg-yellow-500', label: 'Busy',    bg: 'bg-yellow-100', text: 'text-yellow-800' },
  away:    { dot: 'bg-gray-400',   label: 'Away',    bg: 'bg-gray-100',   text: 'text-gray-700' },
  offline: { dot: 'bg-red-400',    label: 'Offline', bg: 'bg-red-100',    text: 'text-red-800' },
}

const avatarColors = ['#00B69B', '#00B69B', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B']
const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
const getColor = (i: number) => avatarColors[i % avatarColors.length]

export function AgentTable() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editAgent, setEditAgent] = useState<Agent | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('NOS Agent')
  const [roleOptions, setRoleOptions] = useState<string[]>([])
  const [editMaxChats, setEditMaxChats] = useState(5)
  const [editStatus, setEditStatus] = useState<'online' | 'busy' | 'away' | 'offline'>('online')
  const [editMobile, setEditMobile] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchAgents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('agents')
      .select('*, agent_teams(teams(name))')
      .order('role', { ascending: false })
      .order('name')
    if (!error && data) setAgents(data as any)
    setLoading(false)
  }

  useEffect(() => {
    fetchAgents()
    // load role names from Terms & Roles for the role dropdown
    supabase.from('roles').select('name').order('name').then(({ data }) => {
      if (data) setRoleOptions(data.map(r => r.name))
    })
  }, [])

  // ─── KPI ─────────────────────────────────────
  const counts = useMemo(() => ({
    total:     agents.length,
    inAction:  agents.filter(a => a.is_active && (a.status === 'online' || a.status === 'busy')).length,
    suspended: agents.filter(a => !a.is_active).length,
    online:    agents.filter(a => a.status === 'online').length,
    busy:      agents.filter(a => a.status === 'busy').length,
    away:      agents.filter(a => a.status === 'away').length,
    offline:   agents.filter(a => a.status === 'offline').length,
  }), [agents])

  // ─── SEARCH FILTER ───────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return agents
    const q = search.toLowerCase()
    return agents.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.mobile_number || '').includes(q) ||
      (a.agent_teams?.map(t => t.teams?.name || '').join(' ') || '').toLowerCase().includes(q)
    )
  }, [agents, search])

  // ─── EDIT ────────────────────────────────────
  const openEdit = (agent: Agent) => {
    setEditAgent(agent)
    setEditName(agent.name)
    setEditRole(agent.role)
    setEditMaxChats(agent.max_chats)
    setEditStatus(agent.status)
    setEditMobile(agent.mobile_number || '')
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
      mobile_number: editMobile,
    }).eq('id', editAgent.id)
    setSaving(false)
    setEditAgent(null)
    fetchAgents()
  }

  // ─── TOGGLE ACTIVE ───────────────────────────
  const toggleActive = async (agent: Agent, e?: React.MouseEvent) => {
    e?.stopPropagation()
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
    fetchAgents()
  }

  // ─── EXPORT CSV ──────────────────────────────
  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Mobile', 'Role', 'Status', 'Active', 'Max Chats', 'Teams', 'Joined'],
      ...agents.map(a => [
        a.name,
        a.email,
        a.mobile_number || '',
        a.role,
        a.status,
        a.is_active ? 'Yes' : 'No',
        String(a.max_chats),
        a.agent_teams?.map(t => t.teams?.name).filter(Boolean).join('; ') || '',
        new Date(a.created_at).toLocaleDateString(),
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'agents.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      <span className="ml-3 text-gray-500">Loading agents...</span>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-[#00B69B]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total Agents</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
            <Activity className="w-6 h-6 text-[#00B69B]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{counts.inAction}</p>
            <p className="text-xs text-gray-400 mt-0.5">In Action</p>
            <p className="text-xs text-gray-300">{counts.online} online · {counts.busy} busy</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <UserMinus className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{counts.suspended}</p>
            <p className="text-xs text-gray-400 mt-0.5">Suspended</p>
          </div>
        </div>
      </div>

      {/* ─── Search + Export ─── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, team..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
        <div className="flex items-center gap-2 ml-auto text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />{counts.online}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" />{counts.busy}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" />{counts.away}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />{counts.offline}</span>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Mobile</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Teams</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Max Chats</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Active</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400">No agents found</td></tr>
            )}
            {filtered.map((agent, index) => {
              const status = statusConfig[agent.status] || statusConfig.offline
              const teams = agent.agent_teams?.map(t => t.teams?.name).filter(Boolean) || []
              return (
                <tr key={agent.id} className={cn('transition-colors', agent.is_active ? 'hover:bg-emerald-50/40' : 'opacity-50 bg-gray-50')}>

                  {/* Agent */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                        style={{ backgroundColor: getColor(index) }}>
                        {getInitials(agent.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{agent.name}</p>
                        <p className="text-xs text-gray-400">{agent.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Mobile */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{agent.mobile_number || <span className="text-gray-300">—</span>}</span>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold',
                      /super/i.test(agent.role) ? 'bg-purple-100 text-purple-800'
                        : /admin/i.test(agent.role) ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700')}>
                      {agent.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={cn('flex items-center gap-1.5 text-xs font-medium w-fit px-2.5 py-1 rounded-full', status.bg, status.text)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                      {status.label}
                    </span>
                  </td>

                  {/* Teams */}
                  <td className="px-6 py-4">
                    {teams.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {teams.map(t => (
                          <span key={t} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </td>

                  {/* Max Chats */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{agent.max_chats}</span>
                  </td>

                  {/* Active Toggle */}
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => toggleActive(agent, e)}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                        agent.is_active ? 'bg-[#00B69B]' : 'bg-gray-300'
                      )}
                    >
                      <span className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
                        agent.is_active ? 'translate-x-6' : 'translate-x-1'
                      )} />
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(agent)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Edit
                      </button>
                      <div className="relative">
                        <button onClick={() => setOpenMenuId(openMenuId === agent.id ? null : agent.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        {openMenuId === agent.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                            <button onClick={() => openEdit(agent)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                              <Edit className="w-4 h-4" /> Change Role
                            </button>
                            <button onClick={() => toggleActive(agent)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-yellow-600 hover:bg-yellow-50">
                              <UserX className="w-4 h-4" /> {agent.is_active ? 'Suspend' : 'Activate'}
                            </button>
                            <button onClick={() => { setConfirmDelete(agent.id); setOpenMenuId(null) }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100">
                              <Trash2 className="w-4 h-4" /> Delete
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

        {/* Pagination hint */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">Showing {filtered.length} of {agents.length} agents</p>
        </div>
      </div>

      {/* ─── EDIT DRAWER ─── */}
      {editAgent && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setEditAgent(null)}>
          <div className="w-96 h-full bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Edit Agent</h2>
              <button onClick={() => setEditAgent(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl" style={{ backgroundColor: '#00B69B' }}>
                  {getInitials(editName)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input type="text" value={editAgent.email} readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                <input type="text" value={editMobile} onChange={e => setEditMobile(e.target.value)}
                  placeholder="e.g. 201111234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                  {!roleOptions.includes(editRole) && <option value={editRole}>{editRole}</option>}
                  {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">Permissions come from Terms &amp; Roles</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                  <option value="online">🟢 Online</option>
                  <option value="busy">🟡 Busy</option>
                  <option value="away">⚫ Away</option>
                  <option value="offline">🔴 Offline</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Concurrent Chats</label>
                <input type="number" value={editMaxChats} onChange={e => setEditMaxChats(Number(e.target.value))} min={1} max={20}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button onClick={() => setEditAgent(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: '#00B69B' }}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM ─── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Agent?</h3>
            <p className="text-sm text-gray-500 mb-6">This will permanently remove the agent and all their team assignments.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => deleteAgent(confirmDelete)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
