'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Zap, Smile, Paperclip, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  direction: string
  content: string
  created_at: string
  status: string
}

interface ConvInfo {
  id: string
  status: string
  assigned_agent_id: string | null
  contacts: { name: string; phone: string } | null
}

interface ChatPanelProps { conversationId: string | null }

export function ChatPanel({ conversationId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [convInfo, setConvInfo] = useState<ConvInfo | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async () => {
    if (!conversationId) return
    setLoading(true)
    const [convRes, msgRes] = await Promise.all([
      supabase.from('conversations').select('id, status, assigned_agent_id, contacts(name, phone)').eq('id', conversationId).single(),
      supabase.from('messages').select('id, direction, content, created_at, status').eq('conversation_id', conversationId).order('created_at', { ascending: true }),
    ])
    if (convRes.data) setConvInfo(convRes.data as any)
    if (msgRes.data) setMessages(msgRes.data)
    setLoading(false)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  useEffect(() => {
    fetchMessages()
    if (!conversationId) return
    const ch = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [conversationId])

  const handleSend = async () => {
    if (!message.trim() || !conversationId) return
    setSending(true)
    const { error: msgErr } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      direction: 'outbound',
      type: 'text',
      content: message.trim(),
      sender: 'agent',
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
    }).eq('id', conversationId)
    setMessage('')
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleSend() }
  }

  const resolveConversation = async () => {
    if (!conversationId) return
    await supabase.from('conversations').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', conversationId)
    fetchMessages()
  }

  const closeConversation = async () => {
    if (!conversationId) return
    await supabase.from('conversations').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', conversationId)
    fetchMessages()
  }

  if (!conversationId) {
    return <div className="flex items-center justify-center h-full bg-white"><p className="text-gray-400">Select a conversation to start chatting</p></div>
  }

  const contact = convInfo?.contacts as any
  const name = contact?.name || '—'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between h-16 border-b border-gray-200 px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-semibold text-sm" style={{ backgroundColor: '#C0992F' }}>{initials}</div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-500">{contact?.phone}</p>
              {convInfo?.status && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${convInfo.status === 'open' ? 'bg-blue-100 text-blue-700' : convInfo.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{convInfo.status}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resolveConversation} className="px-3 py-1.5 text-sm font-medium text-white rounded hover:opacity-90" style={{ backgroundColor: '#00B69B' }}>Resolve</button>
          <button onClick={closeConversation} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">Close</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full"><RefreshCw className="w-5 h-5 animate-spin text-gray-400" /></div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full"><p className="text-gray-400">No messages yet</p></div>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} className={`flex w-full ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                <div style={msg.direction === 'outbound'
                  ? { backgroundColor: '#C0992F', color: '#FFF', borderRadius: '18px 18px 4px 18px', padding: '10px 14px', maxWidth: '65%', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }
                  : { backgroundColor: '#F1F5F9', color: '#1F2937', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', maxWidth: '65%' }
                }>
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs mt-1" style={{ color: msg.direction === 'outbound' ? 'rgba(255,255,255,0.6)' : '#9CA3AF', textAlign: msg.direction === 'outbound' ? 'right' : 'left', fontSize: '11px' }}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {convInfo?.status !== 'closed' && convInfo?.status !== 'resolved' && (
        <div className="border-t border-gray-200 bg-white" style={{ height: '64px', padding: '0 16px' }}>
          <div className="flex items-center gap-3 h-full">
            <button className="p-2 text-gray-600 hover:text-amber-600"><Zap className="w-5 h-5" /></button>
            <button className="p-2 text-gray-600 hover:text-amber-600"><Smile className="w-5 h-5" /></button>
            <button className="p-2 text-gray-600 hover:text-amber-600"><Paperclip className="w-5 h-5" /></button>
            <textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type a message..." className="flex-1 h-full py-2 resize-none border-0 outline-none bg-transparent text-gray-900 placeholder-gray-400 text-sm" />
            <button onClick={handleSend} disabled={sending || !message.trim()} className="flex-shrink-0 w-10 h-10 rounded-full text-white hover:opacity-90 flex items-center justify-center disabled:opacity-50" style={{ backgroundColor: '#C0992F' }}>
              {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
