'use client'

import { useState, useEffect } from 'react'
import { Eye, Clock, MessageCircle, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface Conversation {
  id: string
  contact_name: string
  contact_phone: string
  status: string
  agent_id: string | null
  created_at: string
  updated_at: string
}

interface Agent { id: string; name: string }

function getStatusColor(status: string) {
  switch (status) {
    case 'open': return 'bg-blue-100 text-blue-800'
    case 'resolved': return 'bg-green-100 text-green-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'closed': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function ConversationsTable() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [msgCounts, setMsgCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const [convRes, agentRes] = await Promise.all([
        supabase.from('conversations').select('*').order('updated_at', { ascending: false }).limit(50),
        supabase.from('agents').select('id, name'),
      ])
      if (convRes.data) {
        setConversations(convRes.data)
        // fetch message counts
        const counts: Record<string, number> = {}
        for (const c of convRes.data) {
          const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('conversation_id', c.id)
          counts[c.id] = count || 0
        }
        setMsgCounts(counts)
      }
      if (agentRes.data) setAgents(agentRes.data)
      setLoading(false)
    }
    fetch()
  }, [])

  const getAgentName = (id: string | null) => {
    if (!id) return 'Unassigned'
    return agents.find(a => a.id === id)?.name || '—'
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /><span className="ml-3 text-gray-500">Loading...</span></div>
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Agent</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Messages</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {conversations.map(conv => (
            <tr key={conv.id} className="hover:bg-amber-50 transition-colors">
              <td className="px-6 py-4">
                <div>
                  <p className="font-medium text-sm text-gray-900">{conv.contact_name}</p>
                  <p className="text-xs text-gray-500">{conv.contact_phone}</p>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">{getAgentName(conv.agent_id)}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  {msgCounts[conv.id] || 0}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={cn('text-xs px-2 py-1 rounded-full font-medium', getStatusColor(conv.status))}>{conv.status}</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{new Date(conv.updated_at).toLocaleString()}</td>
              <td className="px-6 py-4">
                <button className="p-1 hover:bg-gray-100 rounded-lg"><Eye className="w-4 h-4 text-gray-500" /></button>
              </td>
            </tr>
          ))}
          {conversations.length === 0 && (
            <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No conversations found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
