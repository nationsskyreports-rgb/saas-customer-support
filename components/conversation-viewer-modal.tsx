'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, RefreshCw, StickyNote, Users, User, Tag, Clock, ExternalLink, CheckCircle2, Flag } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  direction: string
  content: string
  created_at: string
  status: string
  sender_agent_id?: string | null
}

interface Note {
  id: string
  content: string
  created_at: string
  agents: { name: string } | null
}

interface ConvFull {
  id: string
  status: string
  priority: string | null
  subject: string | null
  assigned_agent_id: string | null
  team_id: string | null
  log_category_id: string | null
  created_at: string
  updated_at: string
  resolved_at?: string | null
  closed_at?: string | null
  contacts: { name: string; phone: string; email?: string } | null
  teams: { name: string } | null
  log_categories?: { name: string } | null
}

interface Props {
  conversationId: string | null
  onClose: () => void
}

/**
 * Full read-only monitor for any conversation:
 * chat thread + internal notes + details (agent, team, category, priority, timestamps).
 * Subscribes to realtime message inserts so open chats can be monitored live.
 */
export function ConversationViewerModal({ conversationId, onClose }: Props) {
  const router = useRouter()
  const [conv, setConv] = useState<ConvFull | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [agentName, setAgentName] = useState<string>('Unassigned')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'details' | 'notes'>('details')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!conversationId) return
    let cancelled = false

    const fetchAll = async () => {
      setLoading(true)
      const [convRes, msgRes, notesRes] = await Promise.all([
        supabase
          .from('conversations')
          .select('id, status, priority, subject, assigned_agent_id, team_id, log_category_id, created_at, updated_at, resolved_at, closed_at, contacts(name, phone, email), teams(name), log_categories(name)')
          .eq('id', conversationId)
          .single(),
        supabase
          .from('messages')
          .select('id, direction, content, created_at, status, sender_agent_id')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true }),
        supabase
          .from('conversation_notes')
          .select('id, content, created_at, agents(name)')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false }),
      ])
      if (cancelled) return
      if (convRes.data) {
        const d = convRes.data as any
        setConv(d)
        if (d.assigned_agent_id) {
          const { data: ag } = await supabase.from('agents').select('name').eq('id', d.assigned_agent_id).single()
          if (!cancelled && ag) setAgentName(ag.name)
        } else {
          setAgentName('Unassigned')
        }
      }
      if (msgRes.data) setMessages(msgRes.data)
      if (notesRes.data) setNotes(notesRes.data as any)
      setLoading(false)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'auto' }), 100)
    }

    fetchAll()

    // Live monitor: new messages + new notes appear instantly
    const ch = supabase
      .channel(`viewer-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_notes', filter: `conversation_id=eq.${conversationId}` }, () => {
        supabase
          .from('conversation_notes')
          .select('id, content, created_at, agents(name)')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .then(({ data }) => { if (data) setNotes(data as any) })
      })
      .subscribe()

    return () => { cancelled = true; supabase.removeChannel(ch) }
  }, [conversationId])

  if (!conversationId) return null

  const contact = conv?.contacts as any
  const name = contact?.name || '—'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const statusBadge = (s?: string) => {
    switch (s) {
      case 'open': return 'bg-blue-100 text-blue-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'resolved': return 'bg-green-100 text-green-700'
      case 'closed': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const fmtTime = (ts: string) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const fmtFull = (ts?: string | null) => ts ? new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  const detailRow = (icon: React.ReactNode, label: string, value: React.ReactNode) => (
    <div className="flex items-start gap-2.5 py-2">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
        <div className="text-sm text-gray-800 font-medium mt-0.5 break-words">{value}</div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden"
        style={{ height: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-semibold text-sm flex-shrink-0" style={{ backgroundColor: '#00B69B' }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-500">{contact?.phone || ''}</p>
                {conv?.status && (
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusBadge(conv.status)}`}>{conv.status}</span>
                )}
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400 flex items-center gap-1"><StickyNote className="w-3 h-3" /> {notes.length} notes</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/inbox/all?conv=${conversationId}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open in Inbox
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat thread (read-only) */}
          <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-sm">No messages in this conversation</p>
                </div>
              ) : (
                <>
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex w-full ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                      <div style={msg.direction === 'outbound'
                        ? { backgroundColor: '#00B69B', color: '#FFF', borderRadius: '18px 18px 4px 18px', padding: '10px 14px', maxWidth: '70%', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }
                        : { backgroundColor: '#FFF', color: '#1F2937', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', maxWidth: '70%', border: '1px solid #E5E7EB' }
                      }>
                        <p className="text-sm whitespace-pre-wrap" dir="auto">{msg.content}</p>
                        <p className="text-xs mt-1" style={{ color: msg.direction === 'outbound' ? 'rgba(255,255,255,0.6)' : '#9CA3AF', textAlign: msg.direction === 'outbound' ? 'right' : 'left', fontSize: '11px' }}>
                          {fmtTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </>
              )}
            </div>
            <div className="border-t border-gray-200 bg-white px-4 py-2.5 text-center flex-shrink-0">
              <p className="text-xs text-gray-400">
                {conv?.status === 'open' || conv?.status === 'pending'
                  ? '🔴 Live monitor — new messages appear in real time'
                  : 'Read-only view of a completed conversation'}
              </p>
            </div>
          </div>

          {/* Side panel: Details + Notes */}
          <div className="w-80 border-l border-gray-200 bg-white flex flex-col flex-shrink-0 overflow-hidden">
            <div className="flex border-b border-gray-200 flex-shrink-0">
              {(['details', 'notes'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${tab === t ? 'text-[#00B69B] border-b-2 border-[#00B69B]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {t === 'details' ? 'Details' : `Notes (${notes.length})`}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {tab === 'details' ? (
                <div className="divide-y divide-gray-50">
                  {detailRow(<User className="w-4 h-4" />, 'Assigned Agent', agentName)}
                  {detailRow(<Users className="w-4 h-4" />, 'Team',
                    (conv?.teams as any)?.name
                      ? <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold text-white" style={{ backgroundColor: '#00B69B' }}><Users className="w-3 h-3" /> {(conv?.teams as any).name}</span>
                      : <span className="text-gray-400">—</span>
                  )}
                  {detailRow(<Tag className="w-4 h-4" />, 'Log Category', (conv?.log_categories as any)?.name || <span className="text-gray-400">—</span>)}
                  {detailRow(<Flag className="w-4 h-4" />, 'Priority',
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${conv?.priority === 'urgent' ? 'bg-red-100 text-red-700' : conv?.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                      {conv?.priority || 'normal'}
                    </span>
                  )}
                  {detailRow(<Clock className="w-4 h-4" />, 'Created', fmtFull(conv?.created_at))}
                  {(conv?.resolved_at || conv?.closed_at) && detailRow(<CheckCircle2 className="w-4 h-4" />, conv?.resolved_at ? 'Resolved' : 'Closed', fmtFull(conv?.resolved_at || conv?.closed_at))}
                  {contact?.email && detailRow(<User className="w-4 h-4" />, 'Email', contact.email)}
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.length === 0 ? (
                    <div className="text-center py-10">
                      <StickyNote className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No internal notes</p>
                    </div>
                  ) : notes.map(note => (
                    <div key={note.id} className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap" dir="auto">{note.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs font-semibold text-amber-700">{(note.agents as any)?.name || 'Agent'}</p>
                        <p className="text-xs text-gray-400">{fmtFull(note.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
