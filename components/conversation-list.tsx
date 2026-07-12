'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'

interface Conversation {
  id: string
  contact_name: string
  contact_phone: string
  status: string
  agent_id: string | null
  created_at: string
  updated_at: string
}

interface Channel { id: string; name: string }

function getStatusColor(status: string) {
  switch (status) {
    case 'open': return 'bg-blue-500'
    case 'pending': return 'bg-yellow-500'
    case 'resolved': return 'bg-green-500'
    default: return 'bg-gray-500'
  }
}

interface ConversationListProps {
  selectedId: string | null
  onSelect: (id: string) => void
  defaultTab?: 'all' | 'mine' | 'unassigned' | 'pending'
}

export function ConversationList({ selectedId, onSelect, defaultTab = 'all' }: ConversationListProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [lastMessages, setLastMessages] = useState<Record<string, { content: string; time: string }>>({})

  const fetchConversations = async () => {
    const [convRes, chRes] = await Promise.all([
      supabase.from('conversations').select('*').order('updated_at', { ascending: false }),
      supabase.from('channels').select('id, name'),
    ])
    if (convRes.data) {
      setConversations(convRes.data)
      // Fetch last message for each conversation
      const msgs: Record<string, { content: string; time: string }> = {}
      for (const c of convRes.data.slice(0, 30)) {
        const { data } = await supabase.from('messages').select('content, created_at').eq('conversation_id', c.id).order('created_at', { ascending: false }).limit(1)
        if (data && data.length > 0) {
          msgs[c.id] = { content: data[0].content, time: timeAgo(data[0].created_at) }
        }
      }
      setLastMessages(msgs)
    }
    if (chRes.data) setChannels(chRes.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchConversations()
    const ch = supabase
      .channel('inbox-conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => fetchConversations())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchConversations())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  const getFiltered = () => {
    switch (activeTab) {
      case 'unassigned': return conversations.filter(c => !c.agent_id)
      case 'pending': return conversations.filter(c => c.status === 'pending')
      default: return conversations
    }
  }

  const filtered = getFiltered()

  const tabs = [
    { id: 'all', label: 'All', count: conversations.length },
    { id: 'unassigned', label: 'Unassigned', count: conversations.filter(c => !c.agent_id).length },
    { id: 'pending', label: 'Pending', count: conversations.filter(c => c.status === 'pending').length },
  ]

  if (loading) {
    return <div className="flex items-center justify-center py-10"><RefreshCw className="w-5 h-5 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1.5 p-3 border-b border-gray-200 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              activeTab === tab.id
                ? 'text-white'
                : 'text-gray-500 border border-gray-200 hover:bg-gray-50'
            )}
            style={activeTab === tab.id ? { backgroundColor: '#C0992F' } : {}}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
      <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No conversations</div>
        ) : filtered.map(conv => {
          const msg = lastMessages[conv.id]
          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                'w-full text-left p-4 hover:bg-gray-50 transition-colors border-l-2',
                selectedId === conv.id ? 'bg-amber-50 border-l-[#C0992F]' : 'border-l-transparent'
              )}
            >
              <div className="flex items-start gap-3 mb-1">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-semibold">
                    {conv.contact_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className={cn('absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white', getStatusColor(conv.status))} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{conv.contact_name}</p>
                  <p className="text-xs text-gray-500">{conv.contact_phone}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{msg ? msg.time : timeAgo(conv.updated_at)}</span>
              </div>
              {msg && <p className="text-sm text-gray-500 truncate pl-13">{msg.content}</p>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
