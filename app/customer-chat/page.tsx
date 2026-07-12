'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, RefreshCw, MessageCircle, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  sender: string
  content: string
  created_at: string
  status: string
}

interface Conversation {
  id: string
  contact_name: string
  contact_phone: string
  status: string
  created_at: string
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

  // Fetch existing open conversations
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .in('status', ['open', 'pending'])
        .order('updated_at', { ascending: false })
      if (data) setConversations(data)
    }
    fetch()
  }, [])

  // Fetch messages + real-time subscription
  useEffect(() => {
    if (!conversationId) return

    const fetchMessages = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('messages')
        .select('*')
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
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [conversationId])

  // Start new conversation
  const startNewChat = async () => {
    if (!contactName.trim() || !contactPhone.trim()) return
    setSending(true)
    const { data } = await supabase
      .from('conversations')
      .insert({
        contact_name: contactName.trim(),
        contact_phone: contactPhone.trim(),
        status: 'open',
        priority: 'normal',
      })
      .select()
      .single()

    if (data) {
      setConversationId(data.id)
      setStep('chat')
    }
    setSending(false)
  }

  // Join existing conversation
  const joinChat = (conv: Conversation) => {
    setConversationId(conv.id)
    setContactName(conv.contact_name)
    setContactPhone(conv.contact_phone)
    setStep('chat')
  }

  // Send message as customer
  const handleSend = async () => {
    if (!message.trim() || !conversationId) return
    setSending(true)
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender: 'customer',
      content: message.trim(),
      status: 'sent',
    })
    await supabase.from('conversations').update({
      updated_at: new Date().toISOString(),
    }).eq('id', conversationId)
    setMessage('')
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  // ==========================================
  // STEP 1: Choose or create conversation
  // ==========================================
  if (step === 'form') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8F4E8' }}>
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white" style={{ backgroundColor: '#C0992F' }}>
              <MessageCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Chat</h1>
            <p className="text-gray-500 mt-1">Test page — send messages as a customer</p>
          </div>

          {/* New conversation */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" style={{ color: '#C0992F' }} />
              Start New Conversation
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Your Name (e.g. أحمد محمد)"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <input
                type="text"
                placeholder="Phone (e.g. +201001234567)"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <button
                onClick={startNewChat}
                disabled={sending || !contactName.trim() || !contactPhone.trim()}
                className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: '#C0992F' }}
              >
                {sending ? 'Creating...' : 'Start Chat'}
              </button>
            </div>
          </div>

          {/* Existing conversations */}
          {conversations.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">Or Join Existing Conversation</h2>
              <div className="space-y-2">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => joinChat(conv)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition-colors text-left border border-gray-100"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#C0992F' }}>
                      {conv.contact_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{conv.contact_name}</p>
                      <p className="text-xs text-gray-500">{conv.contact_phone}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      conv.status === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{conv.status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ==========================================
  // STEP 2: Chat interface
  // ==========================================
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8F4E8' }}>
      <div className="w-full max-w-md h-[700px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0" style={{ backgroundColor: '#C0992F' }}>
          <button onClick={() => setStep('form')} className="text-white/80 hover:text-white text-sm">← Back</button>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
            NOS
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-sm">Nations Of Sky Support</p>
            <p className="text-white/70 text-xs">Online</p>
          </div>
        </div>

        {/* Who am I banner */}
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex-shrink-0">
          <p className="text-xs text-amber-800">
            🧪 You are chatting as: <strong>{contactName}</strong> ({contactPhone})
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: '#FAFAF5' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-sm">Send your first message!</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[75%] shadow-sm"
                  style={msg.sender === 'customer'
                    ? { backgroundColor: '#C0992F', color: '#FFF', borderRadius: '18px 18px 4px 18px', padding: '10px 14px' }
                    : { backgroundColor: '#FFFFFF', color: '#1F2937', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', border: '1px solid #E5E7EB' }
                  }
                >
                  {msg.sender === 'agent' && (
                    <p className="text-xs font-bold mb-1" style={{ color: '#C0992F' }}>Agent</p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs mt-1" style={{
                    color: msg.sender === 'customer' ? 'rgba(255,255,255,0.6)' : '#9CA3AF',
                    textAlign: msg.sender === 'customer' ? 'right' : 'left',
                    fontSize: '10px',
                  }}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white flex items-center gap-3 flex-shrink-0">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="w-10 h-10 rounded-full text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: '#C0992F' }}
          >
            {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
