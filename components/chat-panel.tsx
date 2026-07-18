'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Zap, Smile, Paperclip, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getAgent } from '@/lib/auth'
import { logActivity } from '@/lib/report-utils'

interface Message {
  id: string
  direction: string
  content: string
  created_at: string
  status: string
  type?: string | null
}

interface ConvInfo {
  id: string
  status: string
  assigned_agent_id: string | null
  contacts: { name: string; phone: string } | null
}

interface ChatPanelProps { conversationId: string | null; hideActions?: boolean }

// Curated emoji set for the picker (no external library needed)
const EMOJIS = [
  '😀','😁','😂','🤣','😊','😍','😘','😎','🤔','😅','🙃','😉',
  '👍','👎','👏','🙏','💪','🤝','👋','✌️','🤞','👌','🫡','🙌',
  '❤️','🔥','⭐','✅','❌','⚠️','🎉','🎁','💡','📌','📞','💬',
  '😢','😡','😴','🤯','😱','🥳','😇','🤗','🍀','☕','⏰','🚀',
]

const isImageFile = (f: File) => f.type.startsWith('image/')
const fileNameFromUrl = (url: string) => {
  try {
    const last = decodeURIComponent(url.split('/').pop() || 'file')
    return last.replace(/^\d+_/, '') // strip the timestamp prefix we add on upload
  } catch { return 'file' }
}

export function ChatPanel({ conversationId, hideActions = false }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [convInfo, setConvInfo] = useState<ConvInfo | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [composerError, setComposerError] = useState('')
  const [predefined, setPredefined] = useState<any[]>([])
  const [predefinedOpen, setPredefinedOpen] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const me = getAgent()

  const flashError = (msg: string) => {
    setComposerError(msg)
    setTimeout(() => setComposerError(''), 6000)
  }

  // Load pre-defined messages once
  useEffect(() => {
    supabase.from('predefined_messages').select('*').then(({ data }) => {
      if (data) setPredefined(data)
    })
  }, [])

  const fetchMessages = async () => {
    if (!conversationId) return
    setLoading(true)
    const [convRes, msgRes] = await Promise.all([
      supabase.from('conversations').select('id, status, assigned_agent_id, contacts(name, phone)').eq('id', conversationId).single(),
      supabase.from('messages').select('id, direction, content, created_at, status, type').eq('conversation_id', conversationId).order('created_at', { ascending: true }),
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
      sender_agent_id: me?.id || null,
    })
    if (msgErr) {
      alert('Message error: ' + msgErr.message)
      setSending(false)
      return
    }

    const convUpdate: any = {
      updated_at: new Date().toISOString(),
      last_message_preview: message.trim(),
      last_message_at: new Date().toISOString(),
    }
    // Auto-assign to me if the conversation is unassigned
    if (me && convInfo && !convInfo.assigned_agent_id) {
      convUpdate.assigned_agent_id = me.id
      setConvInfo(prev => prev ? { ...prev, assigned_agent_id: me.id } : prev)
    }
    await supabase.from('conversations').update(convUpdate).eq('id', conversationId)
    setMessage('')
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleSend() }
  }

  // ── Attachments: upload to Supabase Storage, then send as image/file message ──
  const handleAttach = async (file: File) => {
    if (!conversationId) return
    if (file.size > 5 * 1024 * 1024) {
      flashError('File is too large — maximum size is 5 MB')
      return
    }
    setUploading(true)
    setComposerError('')

    const cleanName = file.name.replace(/[^\w.\-()\u0600-\u06FF ]/g, '_')
    const path = `${conversationId}/${Date.now()}_${cleanName}`

    const { error: upErr } = await supabase.storage
      .from('chat-attachments')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (upErr) {
      setUploading(false)
      flashError(
        upErr.message.toLowerCase().includes('bucket')
          ? 'Attachments storage is not set up — run the attachments-and-fixes.sql script'
          : `Upload failed: ${upErr.message}`
      )
      return
    }

    const { data: pub } = supabase.storage.from('chat-attachments').getPublicUrl(path)
    const url = pub?.publicUrl
    if (!url) { setUploading(false); flashError('Could not get the file URL'); return }

    const isImage = isImageFile(file)
    const { error: msgErr } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      direction: 'outbound',
      type: isImage ? 'image' : 'file',
      content: url,
      sender: 'agent',
      sender_agent_id: me?.id || null,
    })
    if (msgErr) {
      setUploading(false)
      flashError(`Message failed: ${msgErr.message}`)
      return
    }

    const convUpdate: any = {
      updated_at: new Date().toISOString(),
      last_message_preview: isImage ? '🖼 Photo' : `📎 ${file.name}`,
      last_message_at: new Date().toISOString(),
    }
    if (me && convInfo && !convInfo.assigned_agent_id) {
      convUpdate.assigned_agent_id = me.id
      setConvInfo(prev => prev ? { ...prev, assigned_agent_id: me.id } : prev)
    }
    await supabase.from('conversations').update(convUpdate).eq('id', conversationId)
    setUploading(false)
  }

  // ── Emoji: insert into the draft at the end ──
  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji)
  }

  const resolveConversation = async () => {
    if (!conversationId) return
    const { error } = await supabase.from('conversations').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', conversationId)
    if (!error) logActivity(me?.name || 'Agent', 'resolved a conversation', 'conversation', { contact: convInfo?.contacts?.name || '' })
    fetchMessages()
  }

  const closeConversation = async () => {
    if (!conversationId) return
    const { error } = await supabase.from('conversations').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', conversationId)
    if (!error) logActivity(me?.name || 'Agent', 'closed a conversation', 'conversation', { contact: convInfo?.contacts?.name || '' })
    fetchMessages()
  }

  const reopenConversation = async () => {
    if (!conversationId) return
    await supabase.from('conversations').update({ status: 'open' }).eq('id', conversationId)
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
          <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-semibold text-sm" style={{ backgroundColor: '#00B69B' }}>{initials}</div>
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
        {!hideActions && (
          <div className="flex items-center gap-2">
            <button onClick={resolveConversation} className="px-3 py-1.5 text-sm font-medium text-white rounded hover:opacity-90" style={{ backgroundColor: '#00B69B' }}>Resolve</button>
            <button onClick={closeConversation} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">Close</button>
          </div>
        )}
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
                  ? { backgroundColor: '#00B69B', color: '#FFF', borderRadius: '18px 18px 4px 18px', padding: '10px 14px', maxWidth: '65%', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }
                  : { backgroundColor: '#F1F5F9', color: '#1F2937', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', maxWidth: '65%' }
                }>
                  {msg.type === 'image' ? (
                    <a href={msg.content} target="_blank" rel="noopener noreferrer">
                      <img src={msg.content} alt="attachment"
                        className="rounded-lg max-w-full cursor-pointer"
                        style={{ maxHeight: '220px', objectFit: 'cover' }} />
                    </a>
                  ) : msg.type === 'file' ? (
                    <a href={msg.content} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-medium underline underline-offset-2"
                      style={{ color: msg.direction === 'outbound' ? '#FFF' : '#0d6e5f' }}>
                      <Paperclip className="w-4 h-4 flex-shrink-0" /> {fileNameFromUrl(msg.content)}
                    </a>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
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

      {(convInfo?.status === 'closed' || convInfo?.status === 'resolved') && (
        <div className="border-t border-gray-200 bg-gray-50 flex items-center justify-center gap-3" style={{ height: '64px', padding: '0 16px' }}>
          <p className="text-sm text-gray-500">This conversation is {convInfo.status}.</p>
          <button onClick={reopenConversation} className="px-4 py-1.5 text-sm font-semibold text-white rounded-lg hover:opacity-90" style={{ backgroundColor: '#00B69B' }}>
            Reopen Conversation
          </button>
        </div>
      )}
      {composerError && (
        <p className="text-xs text-red-500 text-center py-1.5 bg-red-50 border-t border-red-100">{composerError}</p>
      )}
      {convInfo?.status !== 'closed' && convInfo?.status !== 'resolved' && (
        <div className="border-t border-gray-200 bg-white" style={{ height: '64px', padding: '0 16px' }}>
          <div className="flex items-center gap-3 h-full">
            <div className="relative">
              <button onClick={() => setPredefinedOpen(!predefinedOpen)} className="p-2 text-gray-600 hover:text-emerald-600" title="Pre-defined messages"><Zap className="w-5 h-5" /></button>
              {predefinedOpen && (
                <div className="absolute bottom-12 left-0 w-80 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-2xl z-50">
                  <div className="px-3 py-2 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">Pre-defined Messages</div>
                  {predefined.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-gray-400 text-center">No pre-defined messages</p>
                  ) : predefined.map((t: any, i: number) => {
                    const title = t.title || t.name || `Message ${i + 1}`
                    const body = t.content || t.message || t.text || t.body || ''
                    return (
                      <button key={t.id || i}
                        onClick={() => { setMessage(body); setPredefinedOpen(false) }}
                        className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 border-b border-gray-50 transition-colors">
                        <p className="text-sm font-semibold text-gray-900">{title}</p>
                        <p className="text-xs text-gray-500 truncate" dir="auto">{body}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            {/* Emoji picker */}
            <div className="relative">
              <button onClick={() => { setEmojiOpen(!emojiOpen); setPredefinedOpen(false) }}
                className={`p-2 hover:text-emerald-600 ${emojiOpen ? 'text-emerald-600' : 'text-gray-600'}`} title="Emoji">
                <Smile className="w-5 h-5" />
              </button>
              {emojiOpen && (
                <div className="absolute bottom-12 left-0 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-2">
                  <div className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => insertEmoji(e)}
                        className="text-xl p-1.5 rounded-lg hover:bg-emerald-50 transition-colors leading-none">
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Attach file */}
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="p-2 text-gray-600 hover:text-emerald-600 disabled:opacity-40" title="Attach a file (max 5 MB)">
              {uploading ? <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" /> : <Paperclip className="w-5 h-5" />}
            </button>
            <input ref={fileInputRef} type="file" className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleAttach(f); e.target.value = '' }} />

            <textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleKeyDown}
              onFocus={() => setEmojiOpen(false)}
              placeholder="Type a message..." className="flex-1 h-full py-2 resize-none border-0 outline-none bg-transparent text-gray-900 placeholder-gray-400 text-sm" />
            <button onClick={handleSend} disabled={sending || !message.trim()} className="flex-shrink-0 w-10 h-10 rounded-full text-white hover:opacity-90 flex items-center justify-center disabled:opacity-50" style={{ backgroundColor: '#00B69B' }}>
              {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
