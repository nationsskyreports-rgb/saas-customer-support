'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { RefreshCw, MessageCircle, X } from 'lucide-react'

interface Conversation {
  id: string
  contact_id: string
  status: string
  last_message_preview: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
  assigned_agent_id: string | null
  contacts: { name: string; phone: string } | null
}

interface Toast {
  id: number
  title: string
  body: string
  conversationId: string
}

interface ConversationListProps {
  selectedId: string | null
  onSelect: (id: string) => void
  defaultTab?: 'all' | 'unassigned' | 'pending'
}

export function ConversationList({ selectedId, onSelect, defaultTab = 'all' }: ConversationListProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdRef = useRef(0)
  const selectedIdRef = useRef(selectedId)

  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])

  // Ask for browser notification permission once
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const playSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 880
      g.gain.setValueAtTime(0.15, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      o.start(); o.stop(ctx.currentTime + 0.4)
    } catch {}
  }

  const showToast = (title: string, body: string, conversationId: string) => {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, title, body, conversationId }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000)
  }

  const notifyNewMessage = async (msg: any) => {
    // Only notify for customer (inbound) messages
    if (msg.direction !== 'inbound') return
    // Don't notify if the conversation is already open on screen
    if (msg.conversation_id === selectedIdRef.current) return

    // Get contact name
    let name = 'New message'
    const { data: conv } = await supabase
      .from('conversations')
      .select('contacts(name)')
      .eq('id', msg.conversation_id)
      .single()
    const c = (conv as any)?.contacts
    if (c?.name) name = c.name

    playSound()
    showToast(name, msg.content || 'New message', msg.conversation_id)

    // Browser notification (works even in another tab)
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification(name, { body: msg.content || 'New message', icon: '/favicon.ico' })
      n.onclick = () => { window.focus(); onSelect(msg.conversation_id); n.close() }
    }
  }

  const fetchConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('id, contact_id, status, last_message_preview, last_message_at, created_at, updated_at, assigned_agent_id, contacts(name, phone)')
      .order('updated_at', { ascending: false })
    if (data) setConversations(data as any)
    setLoading(false)
  }

  useEffect(() => {
    fetchConversations()
    const ch = supabase
      .channel('inbox-conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => fetchConversations())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        fetchConversations()
        notifyNewMessage(payload.new)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const timeAgo = (ts: string | null) => {
    if (!ts) return ''
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  const getStatusColor = (s: string) => {
    switch (s) { case 'open': return 'bg-blue-500'; case 'pending': return 'bg-yellow-500'; case 'resolved': return 'bg-green-500'; default: return 'bg-gray-500' }
  }

  const getFiltered = () => {
    switch (activeTab) {
      case 'unassigned': return conversations.filter(c => !c.assigned_agent_id)
      case 'pending': return conversations.filter(c => c.status === 'pending')
      default: return conversations
    }
  }

  const filtered = getFiltered()
  const tabs = [
    { id: 'all', label: 'All', count: conversations.length },
    { id: 'unassigned', label: 'Unassigned', count: conversations.filter(c => !c.assigned_agent_id).length },
    { id: 'pending', label: 'Pending', count: conversations.filter(c => c.status === 'pending').length },
  ]

  if (loading) return <div className="flex items-center justify-center py-10"><RefreshCw className="w-5 h-5 animate-spin text-gray-400" /></div>

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex gap-1.5 p-3 border-b border-gray-200 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={cn('px-3 py-1.5 text-xs font-medium rounded-md transition-colors', activeTab === tab.id ? 'text-white' : 'text-gray-500 border border-gray-200 hover:bg-gray-50')}
            style={activeTab === tab.id ? { backgroundColor: '#C0992F' } : {}}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
      <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No conversations</div>
        ) : filtered.map(conv => {
          const contact = conv.contacts as any
          const name = contact?.name || '—'
          const phone = contact?.phone || ''
          return (
            <button key={conv.id} onClick={() => onSelect(conv.id)}
              className={cn('w-full text-left p-4 hover:bg-gray-50 transition-colors border-l-2', selectedId === conv.id ? 'bg-amber-50 border-l-[#C0992F]' : 'border-l-transparent')}>
              <div className="flex items-start gap-3 mb-1">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-semibold">
                    {name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className={cn('absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white', getStatusColor(conv.status))} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-500">{phone}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(conv.last_message_at || conv.updated_at)}</span>
              </div>
              {conv.last_message_preview && <p className="text-sm text-gray-500 truncate pl-13">{conv.last_message_preview}</p>}
            </button>
          )
        })}
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[100] space-y-2" style={{ maxWidth: '340px' }}>
        {toasts.map(toast => (
          <div key={toast.id}
            onClick={() => { onSelect(toast.conversationId); setToasts(prev => prev.filter(t => t.id !== toast.id)) }}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex items-start gap-3 cursor-pointer hover:shadow-xl transition-all animate-[slideIn_0.3s_ease-out]"
            style={{ animation: 'slideIn 0.3s ease-out' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: '#C0992F' }}>
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900 truncate">{toast.title}</p>
              <p className="text-sm text-gray-500 truncate">{toast.body}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setToasts(prev => prev.filter(t => t.id !== toast.id)) }}
              className="p-1 hover:bg-gray-100 rounded flex-shrink-0">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
