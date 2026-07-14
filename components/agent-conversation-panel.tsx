'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, RefreshCw, Save, StickyNote } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getAgent } from '@/lib/auth'

interface Team { id: string; name: string }
interface Note { id: string; content: string; created_at: string; agents: { name: string } | null }

export function AgentConversationPanel({ conversationId }: { conversationId: string | null }) {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState('')
  const [currentTeam, setCurrentTeam] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [addingNote, setAddingNote] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [notesOpen, setNotesOpen] = useState(true)
  const me = getAgent()

  const fetchAll = async () => {
    if (!conversationId) return
    const [teamRes, convRes, notesRes] = await Promise.all([
      supabase.from('teams').select('id, name').eq('is_active', true).order('name'),
      supabase.from('conversations').select('team_id').eq('id', conversationId).single(),
      supabase.from('conversation_notes').select('id, content, created_at, agents(name)').eq('conversation_id', conversationId).order('created_at', { ascending: false }),
    ])
    if (teamRes.data) setTeams(teamRes.data)
    if (convRes.data) {
      setSelectedTeam(convRes.data.team_id || '')
      setCurrentTeam(convRes.data.team_id || '')
    }
    if (notesRes.data) setNotes(notesRes.data as any)
  }

  useEffect(() => { fetchAll() }, [conversationId])

  const assignTeam = async () => {
    if (!conversationId) return
    setSaving(true)
    await supabase.from('conversations').update({ team_id: selectedTeam || null }).eq('id', conversationId)

    if (selectedTeam && selectedTeam !== currentTeam) {
      const teamName = teams.find(t => t.id === selectedTeam)?.name || 'team'
      await supabase.from('activity_logs').insert({
        agent_id: me?.id || null,
        action: 'assignment',
        description: `${me?.name || 'Agent'} assigned conversation to ${teamName} team`,
        conversation_id: conversationId,
      })
    }
    setCurrentTeam(selectedTeam)
    setSaving(false)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  const addNote = async () => {
    if (!newNote.trim() || !conversationId || !me?.id) return
    setAddingNote(true)
    await supabase.from('conversation_notes').insert({
      conversation_id: conversationId,
      agent_id: me.id,
      content: newNote.trim(),
    })
    setNewNote('')
    setAddingNote(false)
    fetchAll()
  }

  if (!conversationId) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-sm text-gray-400">Select a conversation</p>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ minWidth: '280px' }}>
      <div className="p-5 space-y-5">

        {/* ─── TEAM ASSIGNMENT ─── */}
        <div className="border-b border-gray-200 pb-5">
          <button onClick={() => setDetailsOpen(!detailsOpen)} className="flex items-center gap-2 mb-3 font-semibold text-xs text-gray-500 uppercase tracking-wider hover:text-gray-700">
            {detailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Assign to Team
          </button>
          {detailsOpen && (
            <div className="space-y-3">
              <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">No Team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {currentTeam && (
                <span className="inline-block text-xs px-2.5 py-1 rounded-full font-semibold text-white" style={{ backgroundColor: '#00B69B' }}>
                  Current: {teams.find(t => t.id === currentTeam)?.name}
                </span>
              )}
              <button onClick={assignTeam} disabled={saving || selectedTeam === currentTeam} className="w-full px-3 py-2 text-sm font-semibold text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors" style={{ backgroundColor: savedFlash ? '#00B69B' : '#C0992F' }}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Assigning...' : savedFlash ? '✓ Assigned!' : 'Assign Team'}
              </button>
            </div>
          )}
        </div>

        {/* ─── INTERNAL NOTES ─── */}
        <div>
          <button onClick={() => setNotesOpen(!notesOpen)} className="flex items-center gap-2 mb-3 font-semibold text-xs text-gray-500 uppercase tracking-wider hover:text-gray-700">
            {notesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <StickyNote className="w-3.5 h-3.5" /> Internal Notes ({notes.length})
          </button>
          {notesOpen && (
            <div className="space-y-3">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Add internal note... (only agents see this)"
                rows={3}
                className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
                style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
              />
              <button onClick={addNote} disabled={addingNote || !newNote.trim()} className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#C0992F' }}>
                {addingNote ? 'Adding...' : '+ Add Note'}
              </button>

              <div className="space-y-2">
                {notes.map(n => (
                  <div key={n.id} className="p-3 rounded-lg" style={{ backgroundColor: '#FEF9C3' }}>
                    <p className="text-sm text-gray-800">{n.content}</p>
                    <p className="text-xs text-gray-500 mt-1.5">
                      {(n.agents as any)?.name || 'Agent'} · {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
                {notes.length === 0 && <p className="text-xs text-gray-400">No notes yet</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
