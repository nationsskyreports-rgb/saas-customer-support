'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Target, Zap, RefreshCw, Plus, Edit2, Trash2, X, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Agent {
  id: string
  name: string
  email: string
  role: string
  status: string
  is_active: boolean
  max_chats: number
}

interface AgentStatus {
  id: string
  name: string
  color: string
  is_default: boolean
}

export default function AgentStatusesPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [statuses, setStatuses] = useState<AgentStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<AgentStatus | null>(null)
  const [statusName, setStatusName] = useState('')
  const [statusColor, setStatusColor] = useState('#6B7280')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const [agentsRes, statusesRes] = await Promise.all([
      supabase.from('agents').select('*').eq('is_active', true).order('name'),
      supabase.from('agent_statuses').select('*').order('created_at'),
    ])
    if (agentsRes.data) setAgents(agentsRes.data)
    if (statusesRes.data) setStatuses(statusesRes.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    // Real-time subscription for agent status changes
    const channel = supabase
      .channel('agent-status-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => {
        fetchData()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const getStatusStyle = (status: string) => {
    const found = statuses.find(s => s.name.toLowerCase() === status)
    const color = found?.color || '#6B7280'
    return { dotColor: color, bgColor: color + '20', textColor: color }
  }

  const counts = {
    total: agents.length,
    online: agents.filter(a => a.status === 'online').length,
    busy: agents.filter(a => a.status === 'busy').length,
    away: agents.filter(a => a.status === 'away').length,
    offline: agents.filter(a => a.status === 'offline').length,
  }

  const openCreate = () => { setEditItem(null); setStatusName(''); setStatusColor('#6B7280'); setShowModal(true) }
  const openEdit = (s: AgentStatus) => { setEditItem(s); setStatusName(s.name); setStatusColor(s.color); setShowModal(true) }

  const handleSave = async () => {
    if (!statusName.trim()) return
    setSaving(true)
    if (editItem) {
      await supabase.from('agent_statuses').update({ name: statusName.trim(), color: statusColor }).eq('id', editItem.id)
    } else {
      await supabase.from('agent_statuses').insert({ name: statusName.trim(), color: statusColor })
    }
    setSaving(false)
    setShowModal(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('agent_statuses').delete().eq('id', id)
    setConfirmDelete(null)
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Loading...</span>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agent Statuses</h1>
          <p className="text-muted-foreground mt-1">Real-time status and custom status management</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-colors" style={{ backgroundColor: '#C0992F' }}>
          <Plus className="w-4 h-4" />
          New Status
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Agents</p>
          <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Online</p>
          <p className="text-2xl font-bold text-green-600">{counts.online}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Busy</p>
          <p className="text-2xl font-bold text-yellow-600">{counts.busy}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Away</p>
          <p className="text-2xl font-bold text-gray-600">{counts.away}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Offline</p>
          <p className="text-2xl font-bold text-red-600">{counts.offline}</p>
        </div>
      </div>

      {/* Custom Statuses Table */}
      <div className="mt-8 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Custom Status Types</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Color</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Default</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {statuses.map(s => (
                <tr key={s.id} className="hover:bg-amber-50 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500 font-mono">{s.color}</td>
                  <td className="px-6 py-3 text-sm">{s.is_default ? <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Default</span> : '—'}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-gray-100 rounded"><Edit2 className="w-4 h-4 text-gray-600" /></button>
                      {!s.is_default && <button onClick={() => setConfirmDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agents Grid */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Agent Live Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const style = getStatusStyle(agent.status)
          return (
            <div key={agent.id} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#C0992F' }}>
                    {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{agent.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{agent.role}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: style.bgColor, color: style.textColor }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.dotColor }} />
                  {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-medium text-gray-500">Max Chats</span>
                  </div>
                  <span className="font-bold text-gray-900 text-sm">{agent.max_chats}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">{agent.email}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{editItem ? 'Edit Status' : 'New Status'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status Name *</label>
                <input type="text" value={statusName} onChange={e => setStatusName(e.target.value)} placeholder="e.g. In Meeting" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={statusColor} onChange={e => setStatusColor(e.target.value)} className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                  <input type="text" value={statusColor} onChange={e => setStatusColor(e.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !statusName.trim()} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: '#C0992F' }}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Status?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
