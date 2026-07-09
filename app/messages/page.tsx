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
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      {/* Templates Grid */}
      <MessageTemplates />

      {/* Create Modal */}
      <CreateMessageModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  )
}
