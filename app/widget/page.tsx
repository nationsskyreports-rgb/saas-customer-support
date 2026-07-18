'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, RefreshCw, X, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/**
 * ═══════════════════════════════════════════════════════════════
 * /widget — the chat UI that lives inside the embeddable iframe
 * (loaded by public/widget.js on any external website)
 *
 * - Visitor identity (name/phone/conversation) persists in
 *   localStorage, so returning visitors continue the same chat
 * - New conversations reuse the platform's auto-assignment
 *   (least-loaded online agent with free capacity)
 * - Realtime: agent replies appear instantly; if the widget is
 *   closed, the parent page shows an unread badge (postMessage)
 * ═══════════════════════════════════════════════════════════════
 */

interface Message {
  id: string
  direction: string
  content: string
  created_at: string
}

interface Visitor {
  name: string
  phone: string
  contactId: string
  conversationId: string
}

const STORAGE_KEY = 'nos_widget_visitor'

const loadVisitor = (): Visitor | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
const saveVisitor = (v: Visitor) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) } catch {}
}

const notifyParent = (type: string) => {
  try { window.parent?.postMessage({ type }, '*') } catch {}
}

function WidgetInner() {
  const params = useSearchParams()
  const title = params.get('title') || 'Nations Of Sky'
  const color = params.get('color') || '#00B69B'

  const [phase, setPhase] = useState<'boot' | 'form' | 'chat'>('boot')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [visitor, setVisitor] = useState<Visitor | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [welcome, setWelcome] = useState('')
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [widgetOpen, setWidgetOpen] = useState(true)
  const openRef = useRef(true)
  const endRef = useRef<HTMLDivElement>(null)

  const scrollDown = () =>
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)

  // ── Track open/closed state reported by the parent loader ──
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'nos-widget:opened') { openRef.current = true; setWidgetOpen(true) }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  // ── Boot: restore returning visitor (verify their conversation still exists) ──
  useEffect(() => {
    const boot = async () => {
      // Channel welcome message (shown as the first bubble, display-only)
      const { data: ch } = await supabase.from('channels').select('welcome_message').limit(1).maybeSingle()
      if (ch?.welcome_message) setWelcome(ch.welcome_message)

      const saved = loadVisitor()
      if (saved?.conversationId) {
        const { data: conv } = await supabase
          .from('conversations').select('id').eq('id', saved.conversationId).maybeSingle()
        if (conv) {
          setVisitor(saved)
          setName(saved.name)
          setPhone(saved.phone)
          setPhase('chat')
          return
        }
        // Conversation was deleted → prefill the form with their identity
        setName(saved.name)
        setPhone(saved.phone)
      }
      setPhase('form')
    }
    boot()
  }, [])

  // ── Load history + realtime subscription once we have a conversation ──
  useEffect(() => {
    if (!visitor?.conversationId) return
    let cancelled = false

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, direction, content, created_at')
        .eq('conversation_id', visitor.conversationId)
        .order('created_at', { ascending: true })
        .limit(200)
      if (!cancelled && data) { setMessages(data); scrollDown() }
    }
    fetchMessages()

    const ch = supabase
      .channel(`widget-${visitor.conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${visitor.conversationId}`,
      }, (payload) => {
        const m = payload.new as Message
        setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m])
        scrollDown()
        // Agent reply while the widget is closed → badge on the parent page
        if (m.direction === 'outbound' && !openRef.current) notifyParent('nos-widget:unread')
      })
      .subscribe()

    return () => { cancelled = true; supabase.removeChannel(ch) }
  }, [visitor?.conversationId])

  // ── Start a conversation (same flow as the platform: find/create contact,
  //    auto-assign the least-loaded online agent, create the conversation) ──
  const startChat = useCallback(async () => {
    const vName = name.trim()
    const vPhone = phone.trim()
    if (!vName || vPhone.replace(/\D/g, '').length < 7) {
      setError('Please enter your name and a valid phone number')
      return
    }
    setBusy(true)
    setError('')

    try {
      // 1) Find or create the contact
      let contactId: string
      const { data: existing } = await supabase
        .from('contacts').select('id').eq('phone', vPhone).limit(1).maybeSingle()
      if (existing) {
        contactId = existing.id
      } else {
        const { data: created, error: cErr } = await supabase
          .from('contacts')
          .insert({ name: vName, phone: vPhone, source: 'webchat' })
          .select('id').single()
        if (cErr || !created) throw new Error(cErr?.message || 'Could not create contact')
        contactId = created.id
      }

      // 2) Reuse an existing ACTIVE conversation for this contact if one exists
      const { data: activeConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_id', contactId)
        .in('status', ['open', 'pending'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let conversationId: string
      if (activeConv) {
        conversationId = activeConv.id
      } else {
        // 3) Channel is required
        const { data: channel } = await supabase.from('channels').select('id').limit(1).maybeSingle()
        if (!channel) throw new Error('Support is not configured yet — please try again later')

        // 4) Auto-assignment: least-loaded online agent with free capacity
        let assignedAgentId: string | null = null
        try {
          const { data: onlineAgents } = await supabase
            .from('agents').select('id, max_chats')
            .eq('status', 'online').eq('is_active', true)
          if (onlineAgents && onlineAgents.length > 0) {
            const { data: openConvs } = await supabase
              .from('conversations').select('assigned_agent_id')
              .in('status', ['open', 'pending']).not('assigned_agent_id', 'is', null)
            const load: Record<string, number> = {}
            openConvs?.forEach(c => {
              if (c.assigned_agent_id) load[c.assigned_agent_id] = (load[c.assigned_agent_id] || 0) + 1
            })
            const candidates = onlineAgents
              .map(a => ({ id: a.id, load: load[a.id] || 0, max: a.max_chats || 5 }))
              .filter(a => a.load < a.max)
              .sort((a, b) => a.load - b.load)
            if (candidates.length > 0) assignedAgentId = candidates[0].id
          }
        } catch {}

        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .insert({ contact_id: contactId, channel_id: channel.id, assigned_agent_id: assignedAgentId })
          .select('id').single()
        if (convErr || !conv) throw new Error(convErr?.message || 'Could not start the conversation')
        conversationId = conv.id
      }

      const v: Visitor = { name: vName, phone: vPhone, contactId, conversationId }
      saveVisitor(v)
      setVisitor(v)
      setPhase('chat')
    } catch (e: any) {
      setError(e?.message || 'Something went wrong — please try again')
    }
    setBusy(false)
  }, [name, phone])

  // ── Send a message (identical to the platform's inbound flow) ──
  const send = useCallback(async () => {
    const text = draft.trim()
    if (!text || !visitor || busy) return
    setBusy(true)
    const { error: msgErr } = await supabase.from('messages').insert({
      conversation_id: visitor.conversationId,
      direction: 'inbound',
      type: 'text',
      content: text,
      sender: 'customer',
    })
    if (!msgErr) {
      await supabase.from('conversations').update({
        updated_at: new Date().toISOString(),
        last_message_preview: text,
        last_message_at: new Date().toISOString(),
        status: 'open', // reopen if it was resolved/closed
      }).eq('id', visitor.conversationId)
      setDraft('')
    } else {
      setError(`Message failed: ${msgErr.message}`)
    }
    setBusy(false)
  }, [draft, visitor, busy])

  const fmtTime = (ts: string) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const closeWidget = () => {
    openRef.current = false
    setWidgetOpen(false)
    notifyParent('nos-widget:close')
  }

  // ═════════════════ UI ═════════════════
  return (
    <div className="flex flex-col h-screen bg-white" style={{ fontFamily: 'inherit' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ backgroundColor: color }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">{title}</p>
            <p className="text-white/75 text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block" /> We reply as fast as we can
            </p>
          </div>
        </div>
        <button onClick={closeWidget} className="p-1.5 rounded-lg hover:bg-white/15 transition-colors" aria-label="Close chat">
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Boot */}
      {phase === 'boot' && (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin" style={{ color }} />
        </div>
      )}

      {/* Form */}
      {phase === 'form' && (
        <div className="flex-1 flex flex-col justify-center p-6 space-y-4 overflow-y-auto">
          <div className="text-center mb-2">
            <p className="font-bold text-gray-900">👋 Hi there!</p>
            <p className="text-sm text-gray-500 mt-1">{welcome || 'How can we help you today?'}</p>
          </div>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2"
            style={{ ['--tw-ring-color' as any]: color + '66' }}
          />
          <input
            type="tel" value={phone} onChange={e => setPhone(e.target.value)} dir="ltr"
            onKeyDown={e => e.key === 'Enter' && startChat()}
            placeholder="Phone (e.g. +201099018689)"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2"
            style={{ ['--tw-ring-color' as any]: color + '66' }}
          />
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <button
            onClick={startChat} disabled={busy}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: color }}
          >
            {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Start Chat
          </button>
          <p className="text-[10px] text-gray-300 text-center">Powered by Nations Of Sky</p>
        </div>
      )}

      {/* Chat */}
      {phase === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ backgroundColor: '#F8FAFB' }}>
            {welcome && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-white border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{welcome}</p>
                </div>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.direction === 'inbound' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl shadow-sm ${
                    m.direction === 'inbound'
                      ? 'rounded-br-md text-white'
                      : 'rounded-bl-md bg-white border border-gray-100'
                  }`}
                  style={m.direction === 'inbound' ? { backgroundColor: color } : undefined}
                >
                  <p className={`text-sm whitespace-pre-wrap ${m.direction === 'inbound' ? 'text-white' : 'text-gray-700'}`}>
                    {m.content}
                  </p>
                  <p className={`text-[10px] mt-1 ${m.direction === 'inbound' ? 'text-white/70' : 'text-gray-300'}`}>
                    {fmtTime(m.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {error && <p className="text-xs text-red-500 text-center py-1">{error}</p>}

          {/* Composer */}
          <div className="flex items-end gap-2 p-3 border-t border-gray-100 flex-shrink-0 bg-white">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() }
              }}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 max-h-28"
              style={{ ['--tw-ring-color' as any]: color + '66' }}
            />
            <button
              onClick={send} disabled={busy || !draft.trim()}
              className="p-2.5 rounded-xl text-white disabled:opacity-40 flex-shrink-0 transition-opacity"
              style={{ backgroundColor: color }} aria-label="Send"
            >
              {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function WidgetPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-white">
        <RefreshCw className="w-5 h-5 animate-spin text-gray-300" />
      </div>
    }>
      <WidgetInner />
    </Suspense>
  )
}
