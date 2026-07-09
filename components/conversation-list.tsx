import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const conversations = [
  {
    id: 1,
    customer: 'Ahmed Hassan',
    phone: '+20 123 456 7890',
    lastMessage: 'Thanks for your help!',
    timestamp: '2 mins ago',
    status: 'active',
    avatar: 'AH',
  },
  {
    id: 2,
    customer: 'Fatima Al-Rashid',
    phone: '+20 987 654 3210',
    lastMessage: 'Can you help with my order?',
    timestamp: '15 mins ago',
    status: 'pending',
    avatar: 'FR',
  },
  {
    id: 3,
    customer: 'Mohammed Karim',
    phone: '+20 555 123 4567',
    lastMessage: 'Great, I will wait for updates',
    timestamp: '1 hour ago',
    status: 'resolved',
    avatar: 'MK',
  },
  {
    id: 4,
    customer: 'Layla Ibrahim',
    phone: '+20 444 987 6543',
    lastMessage: 'Perfect, thank you!',
    timestamp: '3 hours ago',
    status: 'resolved',
    avatar: 'LI',
  },
  {
    id: 5,
    customer: 'Khalid Hassan',
    phone: '+20 333 555 7777',
    lastMessage: 'I have a question about the return policy',
    timestamp: '4 hours ago',
    status: 'pending',
    avatar: 'KH',
  },
  {
    id: 6,
    customer: 'Noor Saleh',
    phone: '+20 222 888 9999',
    lastMessage: 'Thank you for resolving this',
    timestamp: 'Yesterday',
    status: 'resolved',
    avatar: 'NS',
  },
  {
    id: 7,
    customer: 'Zainab Rashid',
    phone: '+20 111 444 5555',
    lastMessage: 'When will my order arrive?',
    timestamp: 'Yesterday',
    status: 'pending',
    avatar: 'ZR',
  },
  {
    id: 8,
    customer: 'Hassan Ahmed',
    phone: '+20 666 777 8888',
    lastMessage: 'I received my order, thanks!',
    timestamp: '2 days ago',
    status: 'resolved',
    avatar: 'HA',
  },
]

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-blue-500'
    case 'pending':
      return 'bg-yellow-500'
    case 'resolved':
      return 'bg-green-500'
    default:
      return 'bg-gray-500'
  }
}

interface ConversationListProps {
  selectedId: number
  onSelect: (id: number) => void
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const [activeTab, setActiveTab] = useState('all')

  const tabs = [
    { id: 'all', label: 'All', count: 8 },
    { id: 'mine', label: 'Mine', count: 3 },
    { id: 'unassigned', label: 'Unassigned', count: 0 },
    { id: 'pending', label: 'Pending', count: 3 },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Filter Tabs */}
      <div className="flex gap-2 p-4 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-nos-gold text-white'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            {(tab.id === 'all' || tab.id === 'mine') && tab.count > 0 && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-nos-gold/20 text-nos-gold'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conversation List */}
      <div className="flex-1 divide-y divide-border overflow-y-auto">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={cn(
            'w-full text-left p-4 hover:bg-muted/50 transition-colors border-l-2',
            selectedId === conv.id
              ? 'bg-muted border-l-primary'
              : 'border-l-transparent'
          )}
        >
          <div className="flex items-start gap-3 mb-2">
            <div className="relative mt-1">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/20 text-foreground text-sm font-semibold">
                  {conv.avatar}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
                getStatusColor(conv.status)
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">
                {conv.customer}
              </p>
              <p className="text-xs text-muted-foreground">
                {conv.phone}
              </p>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {conv.timestamp}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate pl-13">
            {conv.lastMessage}
          </p>
        </button>
      ))}
      </div>
    </div>
  )
}
