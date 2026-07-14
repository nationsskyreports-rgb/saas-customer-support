'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { MessageTemplates } from '@/components/message-templates'
import { CreateMessageModal } from '@/components/create-message-modal'

export default function MessagesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pre-defined Messages</h1>
          <p className="text-gray-500 mt-1">Create and manage message templates for quick responses</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 font-semibold"
          style={{ backgroundColor: '#00B69B' }}
        >
          <Plus className="w-4 h-4" />
          New Message
        </button>
      </div>

      <MessageTemplates />
      <CreateMessageModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  )
}
