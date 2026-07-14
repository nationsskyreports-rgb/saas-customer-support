'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'
import { getAgent } from '@/lib/auth'

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

interface ConversationListProps {
  selectedId: string | null
  onSelect: (id: string) => void
  defaultTab?: string
  mineOnly?: boolean       // My Chats mode: tabs become Mine / Unassigned / Pending
  searchTerm?: string      // filter by contact name / phone / last message
}

export function ConversationList({ selectedId, onSelect, defaultTab, mineOnly = false, searchTerm = '' }: ConversationListProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || (mineOnly ? 'mine' : 'all'))
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const me = getAgent()

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
      .channel('inbox-conversations-' + (mineOnly ? 'mine' : 'all'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => fetchConversations())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchConversations())
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

  // Search filter
  const matchesSearch = (c: Conversation) => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.trim().toLowerCase()
    const contact = c.contacts as any
    return (
      (contact?.name || '').toLowerCase().includes(q) ||
      (contact?.phone || '').toLowerCase().includes(q) ||
      (c.last_message_preview || '').toLowerCase().includes(q)
    )
  }

  const searched = conversations.filter(matchesSearch)

  const getFiltered = () => {
    switch (activeTab) {
      case 'mine':       return searched.filter(c => c.assigned_agent_id === me?.id)
      case 'unassigned': return searched.filter(c => !c.assigned_agent_id)
      case 'pending':    return searched.filter(c => c.status === 'pending')
      case 'open':       return searched.filter(c => c.status === 'open' || c.status === 'pending')
      default:           return searched
    }
  }

  const filtered = getFiltered()

  const tabs = mineOnly
    ? [
        { id: 'mine',       label: 'Mine',       count: searched.filter(c => c.assigned_agent_id === me?.id).length },
        { id: 'unassigned', label: 'Unassigned', count: searched.filter(c => !c.assigned_agent_id).length },
        { id: 'pending',    label: 'Pending',    count: searched.filter(c => c.status === 'pending').length },
      ]
    : [
        { id: 'all',        label: 'All',        count: searched.length },
        { id: 'open',       label: 'Open',       count: searched.filter(c => c.status === 'open' || c.status === 'pending').length },
        { id: 'unassigned', label: 'Unassigned', count: searched.filter(c => !c.assigned_agent_id).length },
        { id: 'pending',    label: 'Pending',    count: searched.filter(c => c.status === 'pending').length },
      ]

  if (loading) return <div className="flex items-center justify-center py-10"><RefreshCw className="w-5 h-5 animate-spin text-gray-400" /></div>

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1.5 p-3 border-b border-gray-200 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('px-3 py-1.5 text-xs font-medium rounded-md transition-colors', activeTab === tab.id ? 'text-white' : 'text-gray-500 border border-gray-200 hover:bg-gray-50')}
            style={activeTab === tab.id ? { backgroundColor: '#00B69B' } : {}}>
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
              className={cn('w-full text-left p-4 hover:bg-gray-50 transition-colors border-l-2', selectedId === conv.id ? 'bg-emerald-50 border-l-[#00B69B]' : 'border-l-transparent')}>
              <div className="flex items-start gap-3 mb-1">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-semibold">
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
    </div>
  )
}
