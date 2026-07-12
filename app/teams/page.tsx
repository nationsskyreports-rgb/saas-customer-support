'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Users, RefreshCw, X, Save, UserPlus, UserMinus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Team {
  id: string
  name: string
  description: string
  status: string
  created_at: string
}

interface Agent {
  id: string
  name: string
  email: string
  role: string
  status: string
}

interface AgentTeam {
  agent_id: string
  team_id: string
  role: string
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentTeams, setAgentTeams] = useState<AgentTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Team | null>(null)
  const [teamName, setTeamName] = useState('')
  const [teamDesc, setTeamDesc] = useState('')
  const [teamStatus, setTeamStatus] = useState('active')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [manageTeam, setManageTeam] = useState<Team | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const [teamsRes, agentsRes, atRes] = await Promise.all([
      supabase.from('teams').select('*').order('created_at'),
      supabase.from('agents').select('*').eq('is_active', true).order('name'),
      supabase.from('agent_teams').select('*'),
    ])
    if (teamsRes.data) setTeams(teamsRes.data)
    if (agentsRes.data) setAgents(agentsRes.data)
    if (atRes.data) setAgentTeams(atRes.data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const getTeamAgents = (teamId: string) => {
    const memberIds = agentTeams.filter(at => at.team_id === teamId).map(at => at.agent_id)
    return agents.filter(a => memberIds.includes(a.id))
  }

  const getSupervisor = (teamId: string) => {
    const sup = agentTeams.find(at => at.team_id === teamId && at.role === 'supervisor')
    return sup ? agents.find(a => a.id === sup.agent_id) : null
  }

  const openCreate = () => { setEditItem(null); setTeamName(''); setTeamDesc(''); setTeamStatus('active'); setShowModal(true) }
  const openEdit = (t: Team) => { setEditItem(t); setTeamName(t.name); setTeamDesc(t.description); setTeamStatus(t.status); setShowModal(true) }

  const handleSave = async () => {
    if (!teamName.trim()) return
    setSaving(true)
    if (editItem) {
      await supabase.from('teams').update({ name: teamName.trim(), description: teamDesc.trim(), status: teamStatus }).eq('id', editItem.id)
    } else {
      await supabase.from('teams').insert({ name: teamName.trim(), description: teamDesc.trim(), status: teamStatus })
    }
    setSaving(false)
    setShowModal(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('agent_teams').delete().eq('team_id', id)
    await supabase.from('teams').delete().eq('id', id)
    setConfirmDelete(null)
    fetchData()
  }

  const addAgentToTeam = async (agentId: string, teamId: string, role: string = 'member') => {
    await supabase.from('agent_teams').insert({ agent_id: agentId, team_id: teamId, role })
    fetchData()
  }

  const removeAgentFromTeam = async (agentId: string, teamId: string) => {
    await supabase.from('agent_teams').delete().eq('agent_id', agentId).eq('team_id', teamId)
    fetchData()
  }

  const toggleSupervisor = async (agentId: string, teamId: string) => {
    const current = agentTeams.find(at => at.agent_id === agentId && at.team_id === teamId)
    const newRole = current?.role === 'supervisor' ? 'member' : 'supervisor'
    // Remove existing supervisor if setting new one
    if (newRole === 'supervisor') {
      await supabase.from('agent_teams').update({ role: 'member' }).eq('team_id', teamId).eq('role', 'supervisor')
    }
    await supabase.from('agent_teams').update({ role: newRole }).eq('agent_id', agentId).eq('team_id', teamId)
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Loading teams...</span>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teams Management</h1>
          <p className="text-muted-foreground mt-1">Organize agents into teams for better management</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-colors" style={{ backgroundColor: '#C0992F' }}>
          <Plus className="w-4 h-4" />
          New Team
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const teamAgents = getTeamAgents(team.id)
          const supervisor = getSupervisor(team.id)
          return (
            <div key={team.id} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#C0992F20' }}>
                    <Users className="w-5 h-5" style={{ color: '#C0992F' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{team.name}</h3>
                    <p className="text-xs text-gray-500">{supervisor ? `Supervisor: ${supervisor.name}` : 'No supervisor'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(team)} className="p-2 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                  <button onClick={() => setConfirmDelete(team.id)} className="p-2 hover:bg-gray-100 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>

              {team.description && <p className="text-sm text-gray-500 mb-3">{team.description}</p>}

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-500">Members</span>
                  <span className="text-sm font-bold text-gray-900">{teamAgents.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${team.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {team.status.charAt(0).toUpperCase() + team.status.slice(1)}
                  </span>
                </div>
              </div>

              {teamAgents.length > 0 && (
                <div className="pt-3 border-t border-gray-100 mb-3">
                  <p className="text-xs font-bold text-gray-500 mb-2">Members</p>
                  <div className="space-y-1.5">
                    {teamAgents.map(a => {
                      const isSup = agentTeams.find(at => at.agent_id === a.id && at.team_id === team.id)?.role === 'supervisor'
                      return (
                        <div key={a.id} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#C0992F' }}>
                            {a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-xs text-gray-700 flex-1">{a.name}</span>
                          {isSup && <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">Sup</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <button onClick={() => setManageTeam(team)} className="w-full px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2" style={{ color: '#C0992F' }}>
                <UserPlus className="w-4 h-4" />
                Manage Members
              </button>
            </div>
          )
        })}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{editItem ? 'Edit Team' : 'New Team'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Team Name *</label>
                <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. Team Gamma" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={teamDesc} onChange={e => setTeamDesc(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                <select value={teamStatus} onChange={e => setTeamStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !teamName.trim()} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: '#C0992F' }}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Members Drawer */}
      {manageTeam && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setManageTeam(null)}>
          <div className="w-96 h-full bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Manage Members</h2>
                <p className="text-xs text-gray-500">{manageTeam.name}</p>
              </div>
              <button onClick={() => setManageTeam(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Current Members</p>
              {getTeamAgents(manageTeam.id).length === 0 && <p className="text-sm text-gray-400 mb-4">No members yet</p>}
              {getTeamAgents(manageTeam.id).map(a => {
                const isSup = agentTeams.find(at => at.agent_id === a.id && at.team_id === manageTeam.id)?.role === 'supervisor'
                return (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#C0992F' }}>
                        {a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.name}</p>
                        <p className="text-xs text-gray-500">{isSup ? '⭐ Supervisor' : 'Member'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggleSupervisor(a.id, manageTeam.id)} className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50" title="Toggle supervisor">
                        {isSup ? 'Demote' : '⭐'}
                      </button>
                      <button onClick={() => removeAgentFromTeam(a.id, manageTeam.id)} className="p-1 hover:bg-red-50 rounded">
                        <UserMinus className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                )
              })}

              <p className="text-xs font-semibold text-gray-500 uppercase mt-6 mb-3">Available Agents</p>
              {agents.filter(a => !agentTeams.some(at => at.agent_id === a.id && at.team_id === manageTeam.id)).map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gray-400">
                      {a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <p className="text-sm text-gray-700">{a.name}</p>
                  </div>
                  <button onClick={() => addAgentToTeam(a.id, manageTeam.id)} className="p-1 hover:bg-green-50 rounded">
                    <UserPlus className="w-4 h-4 text-green-600" />
                  </button>
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
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Team?</h3>
            <p className="text-sm text-gray-500 mb-6">All agent assignments to this team will be removed.</p>
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
