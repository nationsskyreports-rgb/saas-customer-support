'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, RefreshCw, MessageCircle, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  direction: string
  content: string
  created_at: string
  status: string
}

interface Conversation {
  id: string
  contact_id: string
  status: string
  created_at: string
  contacts?: { name: string; phone: string }
}

export default function CustomerChatPage() {
  const [step, setStep] = useState<'form' | 'chat'>('form')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('id, contact_id, status, created_at, contacts(name, phone)')
        .order('updated_at', { ascending: false })
        .limit(15)
      if (data) setConversations(data as any)
    }
    fetch()
  }, [])

  useEffect(() => {
    if (!conversationId) return
    const fetchMessages = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('messages')
        .select('id, direction, content, created_at, status')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      if (data) setMessages(data)
      setLoading(false)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    fetchMessages()

    const ch = supabase
      .channel(`customer-chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [conversationId])

  const startNewChat = async () => {
    if (!contactName.trim() || !contactPhone.trim()) return
    setSending(true)

    // Find or create contact
    let contactId: string | null = null
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('phone', contactPhone.trim())
      .limit(1)
      .maybeSingle()

    if (existing) {
      contactId = existing.id
    } else {
      // New contact → default classification ("New Customer" type if it exists)
      let defaultType: string | null = null
      try {
        const { data: t } = await supabase
          .from('customer_types').select('name').ilike('name', 'new customer').limit(1).maybeSingle()
        defaultType = t?.name || null
      } catch {}

      const { data: newContact, error: contactErr } = await supabase
        .from('contacts')
        .insert({ name: contactName.trim(), phone: contactPhone.trim(), source: 'webchat', customer_type: defaultType })
        .select('id')
        .single()
      if (contactErr) {
        alert('Contact error: ' + contactErr.message)
        setSending(false)
        return
      }
      if (newContact) contactId = newContact.id
    }

    if (!contactId) { setSending(false); return }

    // Get first channel (conversations require a channel_id)
    const { data: channel, error: chErr } = await supabase
      .from('channels')
      .select('id')
      .limit(1)
      .maybeSingle()

    if (chErr || !channel) {
      alert('No channel found. Please create a channel first in the Channels page.')
      setSending(false)
      return
    }

    // Auto-assignment: pick the online agent with the fewest open chats (under their max_chats)
    let assignedAgentId: string | null = null
    try {
      const { data: onlineAgents } = await supabase
        .from('agents')
        .select('id, max_chats')
        .eq('status', 'online')
        .eq('is_active', true)

      if (onlineAgents && onlineAgents.length > 0) {
        const { data: openConvs } = await supabase
          .from('conversations')
          .select('assigned_agent_id')
          .in('status', ['open', 'pending'])
          .not('assigned_agent_id', 'is', null)

        const loadMap: Record<string, number> = {}
        openConvs?.forEach(c => {
          if (c.assigned_agent_id) loadMap[c.assigned_agent_id] = (loadMap[c.assigned_agent_id] || 0) + 1
        })

        // Least-loaded online agent who still has capacity
        const candidates = onlineAgents
          .map(a => ({ id: a.id, load: loadMap[a.id] || 0, max: a.max_chats || 5 }))
          .filter(a => a.load < a.max)
          .sort((a, b) => a.load - b.load)

        if (candidates.length > 0) assignedAgentId = candidates[0].id
      }
    } catch {}

    // Create conversation (auto-assigned if an agent is available)
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .insert({ contact_id: contactId, channel_id: channel.id, assigned_agent_id: assignedAgentId })
      .select()
      .single()

    if (convErr) {
      alert('Conversation error: ' + convErr.message)
      setSending(false)
      return
    }

    if (conv) {
      setConversationId(conv.id)
      setStep('chat')
    }
    setSending(false)
  }

  const joinChat = (conv: Conversation) => {
    setConversationId(conv.id)
    const c = conv.contacts as any
    setContactName(c?.name || '—')
    setContactPhone(c?.phone || '—')
    setStep('chat')
  }

  const handleSend = async () => {
    if (!message.trim() || !conversationId) return
    setSending(true)
    const { error: msgErr } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      direction: 'inbound',
      type: 'text',
      content: message.trim(),
      sender: 'customer',
    })
    if (msgErr) {
      alert('Message error: ' + msgErr.message)
      setSending(false)
      return
    }
    await supabase.from('conversations').update({
      updated_at: new Date().toISOString(),
      last_message_preview: message.trim(),
      last_message_at: new Date().toISOString(),
      status: 'open', // reopen if it was closed/resolved
    }).eq('id', conversationId)
    setMessage('')
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleSend() }
  }

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  // ============ FORM SCREEN ============
  if (step === 'form') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8F4E8' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white" style={{ backgroundColor: '#00B69B' }}>
              <MessageCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Chat</h1>
            <p className="text-gray-500 mt-1">Test page — send messages as a customer</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" style={{ color: '#00B69B' }} />
              Start New Conversation
            </h2>
            <div className="space-y-3">
              <input type="text" placeholder="Your Name" value={contactName} onChange={e => setContactName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              <input type="text" placeholder="Phone (e.g. +201099018689)" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              <button onClick={startNewChat} disabled={sending || !contactName.trim() || !contactPhone.trim()} className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50" style={{ backgroundColor: '#00B69B' }}>
                {sending ? 'Creating...' : 'Start Chat'}
              </button>
            </div>
          </div>

          {conversations.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">Or Join Existing</h2>
              <div className="space-y-2">
                {conversations.map(conv => {
                  const c = conv.contacts as any
                  return (
                    <button key={conv.id} onClick={() => joinChat(conv)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-colors text-left border border-gray-100">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#00B69B' }}>
                        {(c?.name || '?').slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{c?.name || '—'}</p>
                        <p className="text-xs text-gray-500">{c?.phone || '—'}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ============ CHAT SCREEN ============
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8F4E8' }}>
      <div className="w-full max-w-md h-[700px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0" style={{ backgroundColor: '#00B69B' }}>
          <button onClick={() => setStep('form')} className="text-white/80 hover:text-white text-sm">← Back</button>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">NOS</div>
          <div className="flex-1">
            <p className="font-bold text-white text-sm">Nations Of Sky Support</p>
            <p className="text-white/70 text-xs">Online</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex-shrink-0">
          <p className="text-xs text-emerald-800">🧪 Chatting as: <strong>{contactName}</strong> ({contactPhone})</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: '#FAFAF5' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full"><RefreshCw className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full"><p className="text-gray-400 text-sm">Send your first message!</p></div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.direction === 'inbound' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[75%] shadow-sm" style={msg.direction === 'inbound'
                  ? { backgroundColor: '#00B69B', color: '#FFF', borderRadius: '18px 18px 4px 18px', padding: '10px 14px' }
                  : { backgroundColor: '#FFF', color: '#1F2937', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', border: '1px solid #E5E7EB' }
                }>
                  {msg.direction === 'outbound' && <p className="text-xs font-bold mb-1" style={{ color: '#00B69B' }}>Agent</p>}
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs mt-1" style={{ color: msg.direction === 'inbound' ? 'rgba(255,255,255,0.6)' : '#9CA3AF', fontSize: '10px' }}>{formatTime(msg.created_at)}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-4 py-3 border-t border-gray-200 bg-white flex items-center gap-3 flex-shrink-0">
          <textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type a message..." rows={1} className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          <button onClick={handleSend} disabled={sending || !message.trim()} className="w-10 h-10 rounded-full text-white flex items-center justify-center disabled:opacity-40" style={{ backgroundColor: '#00B69B' }}>
            {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
