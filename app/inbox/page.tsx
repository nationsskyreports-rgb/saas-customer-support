'use client'

import { useState } from 'react'
import { ConversationList } from '@/components/conversation-list'
import { ChatPanel } from '@/components/chat-panel'
import { ConversationDetails } from '@/components/conversation-details'
import { Search } from 'lucide-react'

export default function InboxPage() {
  const [selectedConversationId, setSelectedConversationId] = useState(1)

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border bg-white">
        <h1 className="text-2xl font-bold text-foreground mb-4">Inbox</h1>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-muted/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Panel 1: Conversation List */}
        <div className="w-80 border-r border-border bg-white overflow-y-auto flex-shrink-0">
          <ConversationList
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
          />
        </div>

        {/* Panel 2: Chat */}
        <div className="flex-1 bg-background flex flex-col overflow-hidden">
          <ChatPanel conversationId={selectedConversationId} />
        </div>

        {/* Panel 3: Details */}
        <div className="w-80 border-l border-border bg-white overflow-y-auto flex-shrink-0">
          <ConversationDetails conversationId={selectedConversationId} />
        </div>
      </div>
    </div>
  )
}
