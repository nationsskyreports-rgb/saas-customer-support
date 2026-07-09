'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AgentTable } from '@/components/agent-table'
import { InviteAgentModal } from '@/components/invite-agent-modal'

export default function AgentsPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agents</h1>
          <p className="text-muted-foreground mt-1">Manage your support team members</p>
        </div>
        <Button
          onClick={() => setIsInviteOpen(true)}
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Invite Agent
        </Button>
      </div>

      {/* Agents Table */}
      <AgentTable />

      {/* Invite Modal */}
      <InviteAgentModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
    </div>
  )
}
