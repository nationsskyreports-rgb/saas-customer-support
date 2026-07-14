'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, CheckCircle2, Eye, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getAgent } from '@/lib/auth'

interface ResolvedConv {
  id: string
  status: string
  resolved_at: string | null
  closed_at: string | null
  updated_at: string
  message_count: number
  team_id: string | null
  contacts: { name: string; phone: string } | null
  teams: { name: string } | null
}

export default function MyResolvedPage() {
  const [convs, setConvs] = useState<ResolvedConv[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'resolved' | 'closed'>('all')
  const router = useRouter()
  const me = getAgent()

  const fetchResolved = async () => {
    if (!me?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('conversations')
      .select('id, status, resolved_at, closed_at, updated_at, message_count, team_id, contacts(name, phone), teams(name)')
      .eq('assigned_agent_id', me.id)
      .in('status', ['resolved', 'closed'])
      .order('updated_at', { ascending: false })
    if (data) setConvs(data as any)
    setLoading(false)
  }

  useEffect(() => { fetchResolved() }, [])

  const filtered = filter === 'all' ? convs : convs.filter(c => c.status === filter)

  const counts = {
    all: convs.length,
    resolved: convs.filter(c => c.status === 'resolved').length,
    closed: convs.filter(c => c.status === 'closed').length,
  }

  const tabStyle = (id: string) => filter === id
    ? { backgroundColor: '#C0992F', color: '#FFF', border: '2px solid #C0992F', borderRadius: '6px', padding: '6px 16px', fontWeight: 600, fontSize: '13px' }
    : { backgroundColor: '#FFF', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px 16px', fontWeight: 500, fontSize: '13px' }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Loading your resolved chats...</span>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8" style={{ color: '#00B69B' }} />
            My Resolved Chats
          </h1>
          <p className="text-gray-500 mt-1">Conversations you handled and completed</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setFilter('all')} style={tabStyle('all')}>All ({counts.all})</button>
        <button onClick={() => setFilter('resolved')} style={tabStyle('resolved')}>Resolved ({counts.resolved})</button>
        <button onClick={() => setFilter('closed')} style={tabStyle('closed')}>Closed ({counts.closed})</button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="border-b border-gray-200" style={{ backgroundColor: '#FFF9ED' }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Assigned Team</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Messages</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Completed</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(conv => {
              const contact = conv.contacts as any
              const team = conv.teams as any
              const completedAt = conv.resolved_at || conv.closed_at || conv.updated_at
              return (
                <tr key={conv.id} className="hover:bg-amber-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ backgroundColor: '#C0992F' }}>
                        {(contact?.name || '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{contact?.name || '—'}</p>
                        <p className="text-xs text-gray-500">{contact?.phone || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${conv.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {conv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {team?.name ? (
                      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold text-white w-fit" style={{ backgroundColor: '#00B69B' }}>
                        <Users className="w-3 h-3" /> {team.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-900">{conv.message_count}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(completedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => router.push(`/inbox?conv=${conv.id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">No {filter !== 'all' ? filter : ''} chats yet</div>
        )}
      </div>
    </div>
  )
}
