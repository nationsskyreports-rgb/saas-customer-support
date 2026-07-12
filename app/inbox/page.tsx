'use client'

import { useState } from 'react'
import { ConversationList } from '@/components/conversation-list'
import { ChatPanel } from '@/components/chat-panel'
import { ConversationDetails } from '@/components/conversation-details'
import { Search } from 'lucide-react'

export default function InboxPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 3px - 4rem)' }}>
      <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">My Chats</h1>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto flex-shrink-0">
          <ConversationList
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
            defaultTab="all"
          />
        </div>
        <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
          <ChatPanel conversationId={selectedConversationId} />
        </div>
        <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0">
          <ConversationDetails conversationId={selectedConversationId} />
        </div>
      </div>
    </div>
  )
}
