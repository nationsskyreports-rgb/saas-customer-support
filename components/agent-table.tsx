'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MoreVertical, Edit, KeyRound, UserX, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const agents = [
  {
    id: 1,
    name: 'Sarah Ahmed',
    email: 'sarah.ahmed@nos.com',
    role: 'Admin',
    status: 'online',
    activeChats: 3,
    handledToday: 47,
    satisfaction: 98,
    teams: ['Customer Service'],
    joinedDate: 'Jan 15, 2024',
    initials: 'SA',
    color: '#C0992F',
  },
  {
    id: 2,
    name: 'Mohamed Hassan',
    email: 'm.hassan@nos.com',
    role: 'Agent',
    status: 'online',
    activeChats: 2,
    handledToday: 31,
    satisfaction: 94,
    teams: ['Customer Service'],
    joinedDate: 'Feb 20, 2024',
    initials: 'MH',
    color: '#00B69B',
  },
  {
    id: 3,
    name: 'Layla Ibrahim',
    email: 'layla.ibrahim@nos.com',
    role: 'Agent',
    status: 'busy',
    activeChats: 4,
    handledToday: 28,
    satisfaction: 91,
    teams: ['Technical Support'],
    joinedDate: 'Mar 5, 2024',
    initials: 'LI',
    color: '#3B82F6',
  },
  {
    id: 4,
    name: 'Ahmed Karim',
    email: 'a.karim@nos.com',
    role: 'Agent',
    status: 'away',
    activeChats: 0,
    handledToday: 15,
    satisfaction: 89,
    teams: ['Marketing'],
    joinedDate: 'Apr 10, 2024',
    initials: 'AK',
    color: '#8B5CF6',
  },
  {
    id: 5,
    name: 'Nour Mostafa',
    email: 'nour.mostafa@nos.com',
    role: 'Agent',
    status: 'offline',
    activeChats: 0,
    handledToday: 0,
    satisfaction: 87,
    teams: ['Customer Service'],
    joinedDate: 'May 1, 2024',
    initials: 'NM',
    color: '#EC4899',
  },
]

const statusConfig: Record<string, { dot: string; label: string; bg: string; text: string }> = {
  online:  { dot: 'bg-green-500',  label: 'Online',  bg: 'bg-green-100',  text: 'text-green-800' },
  busy:    { dot: 'bg-yellow-500', label: 'Busy',    bg: 'bg-yellow-100', text: 'text-yellow-800' },
  away:    { dot: 'bg-gray-400',   label: 'Away',    bg: 'bg-gray-100',   text: 'text-gray-700' },
  offline: { dot: 'bg-red-500',    label: 'Offline', bg: 'bg-red-100',    text: 'text-red-800' },
}

const counts = {
  total: agents.length,
  online: agents.filter(a => a.status === 'online').length,
  busy: agents.filter(a => a.status === 'busy').length,
  away: agents.filter(a => a.status === 'away').length,
  offline: agents.filter(a => a.status === 'offline').length,
}

export function AgentTable() {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm">
          Total: {counts.total}
        </span>
        <span className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Online: {counts.online}
        </span>
        <span className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Busy: {counts.busy}
        </span>
        <span className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> Away: {counts.away}
        </span>
        <span className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Offline: {counts.offline}
        </span>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Active Chats</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Handled Today</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Satisfaction</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agents.map((agent) => {
              const status = statusConfig[agent.status]
              return (
                <tr
                  key={agent.id}
                  className="hover:bg-amber-50 transition-colors cursor-pointer"
                  onClick={() => setOpenMenuId(null)}
                >
                  {/* Agent */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                        style={{ backgroundColor: agent.color }}
                      >
                        {agent.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{agent.name}</p>
                        <p className="text-xs text-gray-500">{agent.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <span className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-semibold',
                      agent.role === 'Admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-700'
                    )}>
                      {agent.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={cn('flex items-center gap-1.5 text-xs font-medium w-fit px-2.5 py-1 rounded-full', status.bg, status.text)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                      {status.label}
                    </span>
                  </td>

                  {/* Active Chats */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">{agent.activeChats}</span>
                  </td>

                  {/* Handled Today */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">{agent.handledToday}</span>
                  </td>

                  {/* Satisfaction */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">{agent.satisfaction}%</span>
                  </td>

                  {/* Joined */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{agent.joinedDate}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Edit
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === agent.id ? null : agent.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        {openMenuId === agent.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              <Edit className="w-4 h-4" /> Change Role
                            </button>
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              <KeyRound className="w-4 h-4" /> Reset Password
                            </button>
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-yellow-600 hover:bg-yellow-50 transition-colors">
                              <UserX className="w-4 h-4" /> Deactivate
                            </button>
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100">
                              <Trash2 className="w-4 h-4" /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
