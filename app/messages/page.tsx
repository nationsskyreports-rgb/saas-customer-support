'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessageTemplates } from '@/components/message-templates'
import { CreateMessageModal } from '@/components/create-message-modal'

export default function MessagesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pre-defined Messages</h1>
          <p className="text-muted-foreground mt-1">Create and manage message templates for quick responses</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-nos-gold text-white px-4 py-2 rounded-lg hover:bg-nos-gold/90 transition-colors flex items-center gap-2 font-semibold"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Templates Grid */}
      <MessageTemplates />

      {/* Create Modal */}
      <CreateMessageModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  )
}
