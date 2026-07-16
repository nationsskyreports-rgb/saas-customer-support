'use client'

import { useState } from 'react'
import { Eye, MessageCircle, Users, StickyNote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConversationViewerModal } from '@/components/conversation-viewer-modal'

export interface HistoryConversation {
  id: string
  status: string
  assigned_agent_id: string | null
  team_id: string | null
  message_count: number
  created_at: string
  updated_at: string
  resolved_at?: string | null
  closed_at?: string | null
  contacts: { name: string; phone: string } | null
  teams: { name: string } | null
}

interface Props {
  conversations: HistoryConversation[]
  agents: { id: string; name: string }[]
  loading?: boolean
}

function getStatusColor(status: string) {
  switch (status) {
    case 'open': return 'bg-blue-100 text-blue-800'
    case 'resolved': return 'bg-green-100 text-green-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'closed': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function ConversationsTable({ conversations, agents, loading = false }: Props) {
  const [viewerId, setViewerId] = useState<string | null>(null)

  const getAgentName = (id: string | null) => {
    if (!id) return 'Unassigned'
    return agents.find(a => a.id === id)?.name || '—'
  }

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-xl bg-white p-16 text-center text-gray-400 shadow-sm">
        Loading conversations...
      </div>
    )
  }

  return (
    <>
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Team</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Messages</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {conversations.map(conv => {
              const contact = conv.contacts as any
              const team = conv.teams as any
              return (
                <tr
                  key={conv.id}
                  onClick={() => setViewerId(conv.id)}
                  className="hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0" style={{ backgroundColor: '#00B69B' }}>
                        {(contact?.name || '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{contact?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{contact?.phone || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{getAgentName(conv.assigned_agent_id)}</td>
                  <td className="px-6 py-4">
                    {team?.name ? (
                      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold text-white w-fit" style={{ backgroundColor: '#00B69B' }}>
                        <Users className="w-3 h-3" /> {team.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      {conv.message_count ?? 0}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('text-xs px-2 py-1 rounded-full font-medium', getStatusColor(conv.status))}>{conv.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(conv.updated_at).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); setViewerId(conv.id) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#00B69B] transition-colors"
                      title="Open full chat with notes"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <StickyNote className="w-3.5 h-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              )
            })}
            {conversations.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No conversations found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {viewerId && (
        <ConversationViewerModal conversationId={viewerId} onClose={() => setViewerId(null)} />
      )}
    </>
  )
}
