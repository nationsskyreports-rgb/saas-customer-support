'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, RefreshCw, Save, StickyNote, Search, PhoneCall, MessageCircle, Globe } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getAgent } from '@/lib/auth'
import { phoneCandidates, phoneTail } from '@/lib/phone'

interface Team { id: string; name: string }
interface Note { id: string; content: string; created_at: string; agents: { name: string } | null }

// ─── Customer Lookup ─────────────────────────────────────────
// Agent types a phone number → instantly sees whether this customer
// contacted us before, on WHICH channel (WhatsApp / Web Chat), and when.
interface LookupConv {
  id: string
  status: string
  created_at: string
  last_message_at: string | null
  channels: { name: string; type: string } | null
}
interface LookupResult {
  contact: { id: string; name: string; phone: string; customer_type: string | null } | null
  conversations: LookupConv[]
  searched: boolean
}

function CustomerLookup() {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(true)
  const [res, setRes] = useState<LookupResult>({ contact: null, conversations: [], searched: false })

  const lookup = async () => {
    const digits = q.replace(/\D/g, '')
    if (digits.length < 7 || busy) return
    setBusy(true)
    try {
      // 1) Exact match on every historical phone format
      let { data: matches } = await supabase
        .from('contacts')
        .select('id, name, phone, customer_type')
        .in('phone', phoneCandidates(q))
        .limit(1)

      // 2) Fuzzy fallback — last 8 digits (covers odd legacy formats)
      if (!matches || matches.length === 0) {
        const { data: fuzzy } = await supabase
          .from('contacts')
          .select('id, name, phone, customer_type')
          .ilike('phone', `%${phoneTail(q)}%`)
          .limit(1)
        matches = fuzzy || []
      }

      const contact = matches?.[0] || null
      let conversations: LookupConv[] = []
      if (contact) {
        const { data: convs } = await supabase
          .from('conversations')
          .select('id, status, created_at, last_message_at, channels(name, type)')
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false })
          .limit(10)
        conversations = (convs as any) || []
      }
      setRes({ contact, conversations, searched: true })
    } catch {
      setRes({ contact: null, conversations: [], searched: true })
    }
    setBusy(false)
  }

  const isWA = (c: LookupConv) => (c.channels?.type || '').toLowerCase().includes('whatsapp')
  const waCount = res.conversations.filter(isWA).length
  const webCount = res.conversations.length - waCount
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="border-b border-gray-200 pb-5">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 mb-3 font-semibold text-xs text-gray-500 uppercase tracking-wider hover:text-gray-700">
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        <PhoneCall className="w-3.5 h-3.5" /> Customer Lookup
      </button>
      {open && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="tel" dir="ltr" value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookup()}
              placeholder="Phone e.g. 01099018689"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <button onClick={lookup} disabled={busy || q.replace(/\D/g, '').length < 7}
              className="p-2 rounded-lg text-white disabled:opacity-40 flex-shrink-0" style={{ backgroundColor: '#00B69B' }} title="Search by phone">
              {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>

          {res.searched && !res.contact && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              ❌ No customer found with this number — first time contacting us
            </p>
          )}

          {res.contact && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <p className="text-sm font-semibold text-gray-900">{res.contact.name || '—'}</p>
                <p className="text-xs text-gray-500" dir="ltr">{res.contact.phone}</p>
                {res.contact.customer_type && (
                  <span className="inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#00B69B1A', color: '#00B69B' }}>
                    {res.contact.customer_type}
                  </span>
                )}
              </div>

              {/* The direct answer: contacted us on WhatsApp before or not? */}
              <div className={`px-3 py-2 rounded-lg text-xs font-semibold ${waCount > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {waCount > 0
                  ? `✅ Contacted us on WhatsApp before — ${waCount} conversation${waCount > 1 ? 's' : ''}`
                  : '⚠️ Never contacted us on WhatsApp'}
                {webCount > 0 && <span className="block font-normal mt-0.5">💬 {webCount} Web Chat conversation{webCount > 1 ? 's' : ''}</span>}
              </div>

              {res.conversations.length > 0 && (
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {res.conversations.map(c => (
                    <div key={c.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-gray-100 bg-white">
                      {isWA(c)
                        ? <MessageCircle className="w-3.5 h-3.5 flex-shrink-0 text-green-600" />
                        : <Globe className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{c.channels?.name || (isWA(c) ? 'WhatsApp' : 'Web Chat')}</p>
                        <p className="text-[10px] text-gray-400">{fmtDate(c.created_at)}</p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${c.status === 'open' ? 'bg-blue-100 text-blue-700' : c.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

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
    const { data, error } = await supabase.from('conversation_notes').insert({
      conversation_id: conversationId,
      agent_id: me.id,
      content: newNote.trim(),
    }).select('id')
    setAddingNote(false)
    if (error || !data || data.length === 0) {
      alert(
        'Note was NOT saved: ' +
        (error?.message || 'the database rejected it (missing permissions)') +
        '\n\nRun the "attachments-and-fixes.sql" script in Supabase to fix this.'
      )
      return // keep the text so the agent doesn't lose what they wrote
    }
    setNewNote('')
    fetchAll()
  }

  if (!conversationId) return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ minWidth: '280px' }}>
      <div className="p-5 space-y-5">
        <CustomerLookup />
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-gray-400">Select a conversation</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ minWidth: '280px' }}>
      <div className="p-5 space-y-5">

        {/* ─── CUSTOMER LOOKUP (search any phone) ─── */}
        <CustomerLookup />

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
              <button onClick={assignTeam} disabled={saving || selectedTeam === currentTeam} className="w-full px-3 py-2 text-sm font-semibold text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors" style={{ backgroundColor: savedFlash ? '#00B69B' : '#00B69B' }}>
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
                className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
                style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
              />
              <button onClick={addNote} disabled={addingNote || !newNote.trim()} className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#00B69B' }}>
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
