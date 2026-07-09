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
    { id: 'unassigned', label: 'Unassigned', count: 2 },
    { id: 'pending', label: 'Pending', count: 1 },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Filter Tabs */}
      <div className="flex gap-2 p-4 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded whitespace-nowrap text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-nos-gold text-white'
                : 'bg-transparent text-gray-600 border border-gray-200 hover:bg-nos-gold/5 hover:border-nos-gold hover:text-nos-gold'
            }`}
          >
            {tab.label} ({tab.count})
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
            'w-full text-left p-4 hover:bg-gray-50 transition-colors border-l-2 relative',
            selectedId === conv.id
              ? 'bg-gray-100 border-l-nos-gold'
              : 'border-l-transparent'
          )}
        >
          {/* WhatsApp Icon - Top Left */}
          <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-green-500" title="WhatsApp" />

          <div className="flex items-start gap-3 mb-2 pl-3">
            <div className="relative flex-shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-nos-gold/20 text-nos-gold text-sm font-semibold">
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
              <p className="text-xs text-gray-500">
                {conv.phone}
              </p>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {conv.timestamp}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate pl-16">
            {conv.lastMessage}
          </p>

          {/* Channel Label */}
          <p className="text-xs text-gray-400 truncate pl-16 mt-1">
            Nations Of Sky
          </p>

          {/* Agent Avatar - Bottom Right */}
          <div className="absolute bottom-3 right-4 w-5 h-5 rounded-full bg-nos-gold text-white flex items-center justify-center text-xs font-semibold">
            SJ
          </div>
        </button>
      ))}
      </div>
    </div>
  )
}
