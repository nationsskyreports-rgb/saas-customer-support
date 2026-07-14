'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Users, Search, RefreshCw, X, Save, UserPlus, UserMinus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Group { id: string; name: string; description: string; created_at: string }
interface Agent { id: string; name: string; email: string }
interface AgentGroup { agent_id: string; group_id: string }

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentGroups, setAgentGroups] = useState<AgentGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Group | null>(null)
  const [gName, setGName] = useState('')
  const [gDesc, setGDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [manageGroup, setManageGroup] = useState<Group | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const [gRes, aRes, agRes] = await Promise.all([
      supabase.from('groups').select('*').order('created_at'),
      supabase.from('agents').select('id, name, email').eq('is_active', true).order('name'),
      supabase.from('agent_groups').select('*'),
    ])
    if (gRes.data) setGroups(gRes.data)
    if (aRes.data) setAgents(aRes.data)
    if (agRes.data) setAgentGroups(agRes.data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const getGroupAgents = (gid: string) => {
    const ids = agentGroups.filter(ag => ag.group_id === gid).map(ag => ag.agent_id)
    return agents.filter(a => ids.includes(a.id))
  }

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openCreate = () => { setEditItem(null); setGName(''); setGDesc(''); setShowModal(true) }
  const openEdit = (g: Group) => { setEditItem(g); setGName(g.name); setGDesc(g.description); setShowModal(true) }

  const handleSave = async () => {
    if (!gName.trim()) return
    setSaving(true)
    if (editItem) {
      await supabase.from('groups').update({ name: gName.trim(), description: gDesc.trim() }).eq('id', editItem.id)
    } else {
      await supabase.from('groups').insert({ name: gName.trim(), description: gDesc.trim() })
    }
    setSaving(false)
    setShowModal(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('agent_groups').delete().eq('group_id', id)
    await supabase.from('groups').delete().eq('id', id)
    setConfirmDelete(null)
    fetchData()
  }

  const addAgent = async (agentId: string, groupId: string) => {
    await supabase.from('agent_groups').insert({ agent_id: agentId, group_id: groupId })
    fetchData()
  }

  const removeAgent = async (agentId: string, groupId: string) => {
    await supabase.from('agent_groups').delete().eq('agent_id', agentId).eq('group_id', groupId)
    fetchData()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /><span className="ml-3 text-gray-500">Loading groups...</span></div>
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Groups</h1>
          <p className="text-muted-foreground mt-1">Organize agents into groups</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-colors" style={{ backgroundColor: '#00B69B' }}>
          <Plus className="w-4 h-4" />
          New Group
        </button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search groups..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Group Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Members</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredGroups.map(g => (
              <tr key={g.id} className="hover:bg-emerald-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00B69B20' }}>
                      <Users className="w-4 h-4" style={{ color: '#00B69B' }} />
                    </div>
                    <span className="font-medium text-gray-900 text-sm">{g.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{g.description}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{getGroupAgents(g.id).length}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(g.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setManageGroup(g)} className="p-2 hover:bg-gray-100 rounded-lg" title="Manage members"><UserPlus className="w-4 h-4" style={{ color: '#00B69B' }} /></button>
                    <button onClick={() => openEdit(g)} className="p-2 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                    <button onClick={() => setConfirmDelete(g.id)} className="p-2 hover:bg-gray-100 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredGroups.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No groups found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{editItem ? 'Edit Group' : 'New Group'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Group Name *</label>
                <input type="text" value={gName} onChange={e => setGName(e.target.value)} placeholder="e.g. VIP Support" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={gDesc} onChange={e => setGDesc(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !gName.trim()} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: '#00B69B' }}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Members Drawer */}
      {manageGroup && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setManageGroup(null)}>
          <div className="w-96 h-full bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Manage Members</h2>
                <p className="text-xs text-gray-500">{manageGroup.name}</p>
              </div>
              <button onClick={() => setManageGroup(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Current Members ({getGroupAgents(manageGroup.id).length})</p>
              {getGroupAgents(manageGroup.id).length === 0 && <p className="text-sm text-gray-400 mb-4">No members yet</p>}
              {getGroupAgents(manageGroup.id).map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#00B69B' }}>
                      {a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{a.name}</p>
                  </div>
                  <button onClick={() => removeAgent(a.id, manageGroup.id)} className="p-1 hover:bg-red-50 rounded"><UserMinus className="w-4 h-4 text-red-500" /></button>
                </div>
              ))}
              <p className="text-xs font-semibold text-gray-500 uppercase mt-6 mb-3">Available Agents</p>
              {agents.filter(a => !agentGroups.some(ag => ag.agent_id === a.id && ag.group_id === manageGroup.id)).map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gray-400">
                      {a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <p className="text-sm text-gray-700">{a.name}</p>
                  </div>
                  <button onClick={() => addAgent(a.id, manageGroup.id)} className="p-1 hover:bg-green-50 rounded"><UserPlus className="w-4 h-4 text-green-600" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Group?</h3>
            <p className="text-sm text-gray-500 mb-6">All agent assignments to this group will be removed.</p>
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
