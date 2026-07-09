'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const allConversations = [
  { id: 1, customer: 'Ahmed Hassan', phone: '+20 123 456 7890', lastMessage: 'Thanks for your help!', timestamp: '2 mins ago', status: 'active', avatar: 'AH', assignedToMe: true, channel: 'Nations Of Sky' },
  { id: 2, customer: 'Fatima Al-Rashid', phone: '+20 987 654 3210', lastMessage: 'Can you help with my order?', timestamp: '15 mins ago', status: 'pending', avatar: 'FR', assignedToMe: true, channel: 'Nations Of Sky' },
  { id: 3, customer: 'Mohammed Karim', phone: '+20 555 123 4567', lastMessage: 'Great, I will wait for updates', timestamp: '1 hour ago', status: 'resolved', avatar: 'MK', assignedToMe: true, channel: 'NOS Marketing' },
  { id: 4, customer: 'Layla Ibrahim', phone: '+20 444 987 6543', lastMessage: 'Perfect, thank you!', timestamp: '3 hours ago', status: 'resolved', avatar: 'LI', assignedToMe: false, channel: 'Nations Of Sky' },
  { id: 5, customer: 'Khalid Hassan', phone: '+20 333 555 7777', lastMessage: 'I have a question about the return policy', timestamp: '4 hours ago', status: 'pending', avatar: 'KH', assignedToMe: false, channel: 'NOS Marketing' },
  { id: 6, customer: 'Noor Saleh', phone: '+20 222 888 9999', lastMessage: 'Thank you for resolving this', timestamp: 'Yesterday', status: 'resolved', avatar: 'NS', assignedToMe: false, channel: 'Nations Of Sky' },
  { id: 7, customer: 'Zainab Rashid', phone: '+20 111 444 5555', lastMessage: 'When will my order arrive?', timestamp: 'Yesterday', status: 'pending', avatar: 'ZR', assignedToMe: false, channel: 'NOS Marketing' },
  { id: 8, customer: 'Hassan Ahmed', phone: '+20 666 777 8888', lastMessage: 'I received my order, thanks!', timestamp: '2 days ago', status: 'resolved', avatar: 'HA', assignedToMe: false, channel: 'Nations Of Sky' },
]

const unassignedConversations = [
  { id: 9, customer: 'Omar Sayed', phone: '+20 111 222 3344', lastMessage: 'Hello, I need assistance', timestamp: '5 mins ago', status: 'pending', avatar: 'OS', assignedToMe: false, channel: 'Nations Of Sky' },
  { id: 10, customer: 'Nour Khalil', phone: '+20 333 444 5566', lastMessage: 'Is anyone there?', timestamp: '20 mins ago', status: 'pending', avatar: 'NK', assignedToMe: false, channel: 'NOS Marketing' },
]

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-blue-500'
    case 'pending': return 'bg-yellow-500'
    case 'resolved': return 'bg-green-500'
    default: return 'bg-gray-500'
  }
}

interface ConversationListProps {
  selectedId: number
  onSelect: (id: number) => void
  defaultTab?: 'all' | 'mine' | 'unassigned' | 'pending'
}

export function ConversationList({ selectedId, onSelect, defaultTab = 'all' }: ConversationListProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const getFiltered = () => {
    switch (activeTab) {
      case 'mine':
        return allConversations.filter(c => c.assignedToMe)
      case 'unassigned':
        return unassignedConversations
      case 'pending':
        return allConversations.filter(c => c.status === 'pending')
      default:
        return [...allConversations, ...unassignedConversations]
    }
  }

  const filtered = getFiltered()

  const tabs = [
    { id: 'all', label: 'All', count: allConversations.length + unassignedConversations.length },
    { id: 'mine', label: 'Mine', count: allConversations.filter(c => c.assignedToMe).length },
    { id: 'unassigned', label: 'Unassigned', count: unassignedConversations.length },
    { id: 'pending', label: 'Pending', count: allConversations.filter(c => c.status === 'pending').length },
  ]

  const tabStyle = (id: string) => activeTab === id
    ? { backgroundColor: '#C0992F', color: '#FFFFFF', border: '2px solid #C0992F', borderRadius: '6px', padding: '5px 12px', fontWeight: '600', fontSize: '13px', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' as const }
    : { backgroundColor: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '5px 12px', fontWeight: '500', fontSize: '13px', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' as const }

  return (
    <div className="flex flex-col h-full">
      {/* Filter Tabs */}
      <div className="flex gap-1.5 p-3 border-b border-gray-200 flex-wrap">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={tabStyle(tab.id)}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Conversation List */}
      <div className="flex-1 divide-y divide-border overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No conversations</div>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                'w-full text-left p-4 hover:bg-gray-50 transition-colors border-l-2 relative',
                selectedId === conv.id ? 'bg-amber-50 border-l-[#C0992F]' : 'border-l-transparent'
              )}
            >
              <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-green-500" />
              <div className="flex items-start gap-3 mb-1 pl-3">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-semibold">
                    {conv.avatar}
                  </div>
                  <div className={cn('absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white', getStatusColor(conv.status))} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{conv.customer}</p>
                  <p className="text-xs text-gray-500">{conv.phone}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{conv.timestamp}</span>
              </div>
              <p className="text-sm text-gray-500 truncate pl-16">{conv.lastMessage}</p>
              <p className="text-xs text-gray-400 truncate pl-16 mt-0.5">{conv.channel}</p>
              <div className="absolute bottom-3 right-4 w-5 h-5 rounded-full bg-[#C0992F] text-white flex items-center justify-center text-xs font-semibold">
                SJ
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
