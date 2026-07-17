'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Download, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { ConversationsTable, HistoryConversation } from '@/components/conversations-table'

const PAGE_SIZE = 100

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<HistoryConversation[]>([])
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([])
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [moreOpen, setMoreOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [agentFilter, setAgentFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Debounce the search box so we don't hit the DB on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  const activeExtraFilters = [dateFrom, dateTo, agentFilter, teamFilter].filter(Boolean).length

  const fetchConversations = useCallback(async (pageNum: number, append = false) => {
    setLoading(true)

    // ── Server-side search: find matching contacts first, then filter by contact_id ──
    // (searches the WHOLE database, not just the rows already loaded)
    let searchContactIds: string[] | null = null
    if (debouncedSearch) {
      const like = `%${debouncedSearch.replace(/[%_]/g, '\\$&')}%`
      const { data: matches } = await supabase
        .from('contacts')
        .select('id')
        .or(`name.ilike.${like},phone.ilike.${like}`)
        .limit(1000)
      searchContactIds = (matches || []).map(m => m.id)
      if (searchContactIds.length === 0) {
        // No contact matches → no conversations can match; skip the second query
        if (!append) setConversations([])
        setHasMore(false)
        setLoading(false)
        return
      }
    }

    let q = supabase
      .from('conversations')
      .select('id, status, assigned_agent_id, team_id, message_count, created_at, updated_at, resolved_at, closed_at, contacts(name, phone), teams(name)')
      .order('updated_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, pageNum * PAGE_SIZE + PAGE_SIZE - 1)

    if (searchContactIds) q = q.in('contact_id', searchContactIds)
    if (statusFilter !== 'all') q = q.eq('status', statusFilter)
    if (agentFilter) q = agentFilter === 'unassigned' ? q.is('assigned_agent_id', null) : q.eq('assigned_agent_id', agentFilter)
    if (teamFilter) q = q.eq('team_id', teamFilter)
    if (dateFrom) q = q.gte('created_at', new Date(dateFrom + 'T00:00:00').toISOString())
    if (dateTo) q = q.lte('created_at', new Date(dateTo + 'T23:59:59').toISOString())

    const { data } = await q
    const rows = (data || []) as any as HistoryConversation[]
    setConversations(prev => append ? [...prev, ...rows] : rows)
    setHasMore(rows.length === PAGE_SIZE)
    setLoading(false)
  }, [statusFilter, agentFilter, teamFilter, dateFrom, dateTo, debouncedSearch])

  useEffect(() => {
    Promise.all([
      supabase.from('agents').select('id, name').order('name'),
      supabase.from('teams').select('id, name').eq('is_active', true).order('name'),
    ]).then(([aRes, tRes]) => {
      if (aRes.data) setAgents(aRes.data)
      if (tRes.data) setTeams(tRes.data)
    })
  }, [])

  useEffect(() => {
    setPage(0)
    fetchConversations(0)
  }, [fetchConversations])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchConversations(next, true)
  }

  // Search is applied server-side inside fetchConversations — rows are already filtered
  const filtered = conversations

  const clearExtraFilters = () => {
    setDateFrom(''); setDateTo(''); setAgentFilter(''); setTeamFilter('')
  }

  const exportCSV = () => {
    const agentName = (id: string | null) => id ? (agents.find(a => a.id === id)?.name || '') : 'Unassigned'
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const header = ['Customer', 'Phone', 'Agent', 'Team', 'Messages', 'Status', 'Created', 'Last Updated', 'Completed']
    const lines = filtered.map(c => {
      const contact = c.contacts as any
      const team = c.teams as any
      return [
        esc(contact?.name), esc(contact?.phone), esc(agentName(c.assigned_agent_id)),
        esc(team?.name || ''), c.message_count ?? 0, esc(c.status),
        esc(new Date(c.created_at).toLocaleString()),
        esc(new Date(c.updated_at).toLocaleString()),
        esc(c.resolved_at || c.closed_at ? new Date((c.resolved_at || c.closed_at)!).toLocaleString() : ''),
      ].join(',')
    })
    const csv = '\uFEFF' + [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversations-history-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conversations History</h1>
          <p className="text-muted-foreground mt-1">View and manage all past conversations — click any row to open the full chat with notes</p>
        </div>
        <button
          onClick={() => fetchConversations(0)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00B69B]' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 relative min-w-64">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by customer name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <Button variant="outline" className="gap-2 relative" onClick={() => setMoreOpen(!moreOpen)}>
            <Filter className="w-4 h-4" />
            More Filters
            {activeExtraFilters > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ backgroundColor: '#00B69B' }}>
                {activeExtraFilters}
              </span>
            )}
          </Button>
          <Button variant="outline" className="gap-2" onClick={exportCSV}>
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* More Filters panel */}
        {moreOpen && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700">Advanced Filters</h3>
              {activeExtraFilters > 0 && (
                <button onClick={clearExtraFilters} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">From Date</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">To Date</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Agent</label>
                <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
                  <option value="">All Agents</option>
                  <option value="unassigned">Unassigned</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Team</label>
                <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
                  <option value="">All Teams</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results counter */}
      <p className="text-sm text-gray-400 -mt-4">
        Showing {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
        {searchQuery && ` matching "${searchQuery}"`}
      </p>

      {/* Conversations Table */}
      <ConversationsTable conversations={filtered} agents={agents} loading={loading && conversations.length === 0} />

      {hasMore && !loading && (
        <div className="text-center">
          <Button variant="outline" onClick={loadMore}>Load more</Button>
        </div>
      )}
    </div>
  )
}
