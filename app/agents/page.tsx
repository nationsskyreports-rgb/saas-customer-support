'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { AgentTable } from '@/components/agent-table'
import { InviteAgentModal } from '@/components/invite-agent-modal'

export default function AgentsPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Management</h1>
          <p className="text-gray-400 mt-1 text-sm">Manage your support team members and permissions</p>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors hover:opacity-90"
          style={{ backgroundColor: '#00B69B' }}
        >
          <UserPlus className="w-4 h-4" />
          Add New Agent
        </button>
      </div>

      <AgentTable />

      <InviteAgentModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
    </div>
  )
}
