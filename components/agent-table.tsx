'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MoreVertical, Trash2, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'

const agents = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'Senior Agent',
    status: 'active',
    conversations: 142,
    satisfaction: 96,
    joinedDate: 'Jan 15, 2024',
  },
  {
    id: 2,
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'Agent',
    status: 'active',
    conversations: 98,
    satisfaction: 92,
    joinedDate: 'Feb 20, 2024',
  },
  {
    id: 3,
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    role: 'Agent',
    status: 'active',
    conversations: 156,
    satisfaction: 95,
    joinedDate: 'Dec 1, 2023',
  },
  {
    id: 4,
    name: 'Michael Brown',
    email: 'michael.brown@company.com',
    role: 'Agent',
    status: 'inactive',
    conversations: 78,
    satisfaction: 88,
    joinedDate: 'Mar 10, 2024',
  },
]

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-gray-100 text-gray-800'
    case 'away':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function AgentTable() {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted border-b border-border">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Agent</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Role</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Conversations</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Satisfaction</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Joined</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {agents.map((agent) => (
            <tr key={agent.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-foreground text-xs font-semibold">
                      {agent.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm text-foreground">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-foreground">{agent.role}</p>
              </td>
              <td className="px-6 py-4">
                <span className={cn('text-xs px-2 py-1 rounded-full font-medium', getStatusColor(agent.status))}>
                  {agent.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-foreground">{agent.conversations}</p>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-foreground">{agent.satisfaction}%</p>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-muted-foreground">{agent.joinedDate}</p>
              </td>
              <td className="px-6 py-4">
                <div className="relative">
                  <button
                    onClick={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
                    className="p-1 hover:bg-muted rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {expandedId === agent.id && (
                    <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-10">
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-border">
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
