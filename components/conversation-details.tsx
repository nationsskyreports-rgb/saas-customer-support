'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, RefreshCw, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ConvDetails {
  id: string
  contact_name: string
  contact_phone: string
  status: string
  priority: string
  agent_id: string | null
  log_category_id: string | null
  notes: string
  created_at: string
  updated_at: string
}

interface Agent { id: string; name: string }
interface Team { id: string; name: string }
interface LogCategory { id: string; name: string }

interface ConversationDetailsProps {
  conversationId: string | null
}

export function ConversationDetails({ conversationId }: ConversationDetailsProps) {
  const [details, setDetails] = useState<ConvDetails | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [categories, setCategories] = useState<LogCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [conversationOpen, setConversationOpen] = useState(true)
  const [notesOpen, setNotesOpen] = useState(true)
  const [historyOpen, setHistoryOpen] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('normal')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [prevConvs, setPrevConvs] = useState<{ id: string; status: string; created_at: string; msg_count: number }[]>([])

  const fetchDetails = async () => {
    if (!conversationId) return
    setLoading(true)
    const [convRes, agentRes, teamRes, catRes] = await Promise.all([
      supabase.from('conversations').select('*').eq('id', conversationId).single(),
      supabase.from('agents').select('id, name').eq('is_active', true).order('name'),
      supabase.from('teams').select('id, name').eq('status', 'active').order('name'),
      supabase.from('log_categories').select('id, name').order('name'),
    ])

    if (convRes.data) {
      setDetails(convRes.data)
      setSelectedAgent(convRes.data.agent_id || '')
      setSelectedPriority(convRes.data.priority || 'normal')
      setSelectedCategory(convRes.data.log_category_id || '')
      setNoteText(convRes.data.notes || '')

      // fetch previous conversations with same phone
      const { data: prevData } = await supabase
        .from('conversations')
        .select('id, status, created_at')
        .eq('contact_phone', convRes.data.contact_phone)
        .neq('id', conversationId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (prevData) {
        const withCounts = await Promise.all(prevData.map(async (pc) => {
          const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('conversation_id', pc.id)
          return { ...pc, msg_count: count || 0 }
        }))
        setPrevConvs(withCounts)
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
      agent_id: selectedAgent || null,
      priority: selectedPriority,
      log_category_id: selectedCategory || null,
      notes: noteText,
    }).eq('id', conversationId)
    setSaving(false)
  }

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-400">Select a conversation</p>
      </div>
    )
  }

  if (loading || !details) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ minWidth: '280px' }}>
      <div className="p-6 space-y-6">
        {/* Customer Header */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm text-white" style={{ backgroundColor: '#C0992F' }}>
              {details.contact_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{details.contact_name}</p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium inline-block mt-1 ${getStatusColor(details.status)}`}>
                {details.status}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3 pb-4 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-400 mb-1">Phone</p>
            <p className="text-sm font-medium text-gray-900">{details.contact_phone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Created</p>
            <p className="text-sm font-medium text-gray-900">{new Date(details.created_at).toLocaleString()}</p>
          </div>
        </div>

        {/* Conversation Details Section */}
        <div className="border-b border-gray-200 pb-4">
          <button onClick={() => setConversationOpen(!conversationOpen)} className="flex items-center gap-2 mb-4 font-semibold text-xs text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors">
            {conversationOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Conversation Details
          </button>
          {conversationOpen && (
            <div className="space-y-4">
              {/* Assigned Agent */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Assigned Agent</p>
                <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Unassigned</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {/* Priority */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Priority</p>
                <div className="flex gap-2">
                  {['normal', 'high', 'urgent'].map(p => (
                    <button
                      key={p}
                      onClick={() => setSelectedPriority(p)}
                      className={`px-3 py-1.5 text-sm border rounded transition-colors capitalize ${
                        selectedPriority === p
                          ? 'text-white border-transparent'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                      style={selectedPriority === p ? { backgroundColor: p === 'urgent' ? '#EF4444' : p === 'high' ? '#F59E0B' : '#C0992F' } : {}}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Log Category */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Log Category</p>
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">None</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Save */}
              <button onClick={saveChanges} disabled={saving} className="w-full px-3 py-2 text-sm font-semibold text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: '#C0992F' }}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Internal Notes */}
        <div className="border-b border-gray-200 pb-4">
          <button onClick={() => setNotesOpen(!notesOpen)} className="flex items-center gap-2 mb-4 font-semibold text-xs text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors">
            {notesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Internal Notes
          </button>
          {notesOpen && (
            <div className="space-y-3">
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add internal note..."
                className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
                rows={3}
                style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}
              />
              <button onClick={saveChanges} className="px-3 py-1.5 text-sm font-medium text-white rounded hover:opacity-90 transition-colors" style={{ backgroundColor: '#C0992F' }}>
                Save Note
              </button>
            </div>
          )}
        </div>

        {/* Previous Conversations */}
        <div>
          <button onClick={() => setHistoryOpen(!historyOpen)} className="flex items-center gap-2 mb-4 font-semibold text-xs text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors">
            {historyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Previous Conversations ({prevConvs.length})
          </button>
          {historyOpen && (
            <div className="space-y-2">
              {prevConvs.length === 0 ? (
                <p className="text-sm text-gray-400">No previous conversations</p>
              ) : prevConvs.map(pc => (
                <div key={pc.id} className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{new Date(pc.created_at).toLocaleDateString()}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(pc.status)}`}>{pc.status}</span>
                    <span className="text-xs text-gray-500">{pc.msg_count} messages</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
