'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, RefreshCw, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ConvDetails {
  id: string; contact_id: string; status: string; priority: string; assigned_agent_id: string | null
  team_id: string | null
  log_category_id: string | null; subject: string; created_at: string; updated_at: string
  contacts: { name: string; phone: string; email: string } | null
}

interface Agent { id: string; name: string }
interface Team { id: string; name: string }
interface LogCategory { id: string; name: string }
interface ConversationDetailsProps { conversationId: string | null }

export function ConversationDetails({ conversationId }: ConversationDetailsProps) {
  const [details, setDetails] = useState<ConvDetails | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [categories, setCategories] = useState<LogCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [conversationOpen, setConversationOpen] = useState(true)
  const [historyOpen, setHistoryOpen] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('normal')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [prevConvs, setPrevConvs] = useState<{ id: string; status: string; created_at: string }[]>([])

  const fetchDetails = async () => {
    if (!conversationId) return
    setLoading(true)
    const [convRes, agentRes, teamRes, catRes] = await Promise.all([
      supabase.from('conversations').select('id, contact_id, status, priority, assigned_agent_id, team_id, log_category_id, subject, created_at, updated_at, contacts(name, phone, email)').eq('id', conversationId).single(),
      supabase.from('agents').select('id, name').eq('is_active', true).order('name'),
      supabase.from('teams').select('id, name').eq('is_active', true).order('name'),
      supabase.from('log_categories').select('id, name').order('name'),
    ])
    if (convRes.data) {
      const d = convRes.data as any
      setDetails(d)
      setSelectedAgent(d.assigned_agent_id || '')
      setSelectedTeam(d.team_id || '')
      setSelectedPriority(d.priority || 'normal')
      setSelectedCategory(d.log_category_id || '')

      if (d.contact_id) {
        const { data: prevData } = await supabase
          .from('conversations')
          .select('id, status, created_at')
          .eq('contact_id', d.contact_id)
          .neq('id', conversationId)
          .order('created_at', { ascending: false })
          .limit(5)
        if (prevData) setPrevConvs(prevData)
      }
    }
    if (agentRes.data) setAgents(agentRes.data)
    if (teamRes.data) setTeams(teamRes.data)
    if (catRes.data) setCategories(catRes.data)
    setLoading(false)
  }

  useEffect(() => { fetchDetails() }, [conversationId])

  const saveChanges = async () => {
    if (!conversationId) return
    setSaving(true)
    await supabase.from('conversations').update({
      assigned_agent_id: selectedAgent || null,
      team_id: selectedTeam || null,
      priority: selectedPriority,
      log_category_id: selectedCategory || null,
    }).eq('id', conversationId)

    // Log the team assignment activity
    if (selectedTeam && selectedTeam !== details?.team_id) {
      const teamName = teams.find(t => t.id === selectedTeam)?.name || 'team'
      await supabase.from('activity_logs').insert({
        action: 'assignment',
        description: `Conversation assigned to ${teamName} team`,
        conversation_id: conversationId,
      })
    }

    setSaving(false)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  if (!conversationId) return <div className="flex items-center justify-center h-full"><p className="text-sm text-gray-400">Select a conversation</p></div>
  if (loading || !details) return <div className="flex items-center justify-center h-full"><RefreshCw className="w-5 h-5 animate-spin text-gray-400" /></div>

  const contact = details.contacts as any
  const name = contact?.name || '—'
  const phone = contact?.phone || ''
  const getStatusColor = (s: string) => {
    switch (s) { case 'open': return 'bg-blue-100 text-blue-800'; case 'pending': return 'bg-yellow-100 text-yellow-800'; case 'resolved': return 'bg-green-100 text-green-800'; default: return 'bg-gray-100 text-gray-800' }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ minWidth: '280px' }}>
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm text-white" style={{ backgroundColor: '#00B69B' }}>
              {name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{name}</p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium inline-block mt-1 ${getStatusColor(details.status)}`}>{details.status}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pb-4 border-b border-gray-200">
          <div><p className="text-xs text-gray-400 mb-1">Phone</p><p className="text-sm font-medium text-gray-900">{phone}</p></div>
          {contact?.email && <div><p className="text-xs text-gray-400 mb-1">Email</p><p className="text-sm font-medium text-gray-900">{contact.email}</p></div>}
          <div><p className="text-xs text-gray-400 mb-1">Created</p><p className="text-sm font-medium text-gray-900">{new Date(details.created_at).toLocaleString()}</p></div>
        </div>

        <div className="border-b border-gray-200 pb-4">
          <button onClick={() => setConversationOpen(!conversationOpen)} className="flex items-center gap-2 mb-4 font-semibold text-xs text-gray-500 uppercase tracking-wider hover:text-gray-700">
            {conversationOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Conversation Details
          </button>
          {conversationOpen && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-2">Assigned Agent</p>
                <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Unassigned</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {/* ─── TEAM ASSIGNMENT ─── */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Assigned Team</p>
                <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">No Team</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {selectedTeam && (
                  <span className="inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-semibold text-white" style={{ backgroundColor: '#00B69B' }}>
                    → {teams.find(t => t.id === selectedTeam)?.name}
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">Priority</p>
                <div className="flex gap-2">
                  {['normal', 'high', 'urgent'].map(p => (
                    <button key={p} onClick={() => setSelectedPriority(p)}
                      className={`px-3 py-1.5 text-sm border rounded capitalize ${selectedPriority === p ? 'text-white border-transparent' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                      style={selectedPriority === p ? { backgroundColor: p === 'urgent' ? '#EF4444' : p === 'high' ? '#F59E0B' : '#00B69B' } : {}}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Log Category</p>
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">None</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button onClick={saveChanges} disabled={saving} className="w-full px-3 py-2 text-sm font-semibold text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: savedFlash ? '#00B69B' : '#00B69B' }}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : savedFlash ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div>
          <button onClick={() => setHistoryOpen(!historyOpen)} className="flex items-center gap-2 mb-4 font-semibold text-xs text-gray-500 uppercase tracking-wider hover:text-gray-700">
            {historyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Previous ({prevConvs.length})
          </button>
          {historyOpen && (
            <div className="space-y-2">
              {prevConvs.length === 0 ? <p className="text-sm text-gray-400">No previous conversations</p> : prevConvs.map(pc => (
                <div key={pc.id} className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{new Date(pc.created_at).toLocaleDateString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(pc.status)}`}>{pc.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
