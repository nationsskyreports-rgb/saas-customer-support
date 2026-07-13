'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Users, Clock, Star, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { DashboardCard } from '@/components/dashboard-card'
import { MetricsChart } from '@/components/metrics-chart'

interface ConvRow { id: string; status: string; updated_at: string; contacts?: { name: string } | null }

export default function DashboardPage() {
  const [totalConversations, setTotalConversations] = useState(0)
  const [activeAgents, setActiveAgents] = useState(0)
  const [totalAgents, setTotalAgents] = useState(0)
  const [openConvs, setOpenConvs] = useState(0)
  const [resolvedToday, setResolvedToday] = useState(0)
  const [recentConvs, setRecentConvs] = useState<ConvRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const [convRes, agentsRes, openRes, recentRes, resolvedRes] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }),
        supabase.from('agents').select('id, status, is_active'),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).in('status', ['open', 'pending']),
        supabase.from('conversations').select('id, status, updated_at, contacts(name)').order('updated_at', { ascending: false }).limit(5),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('status', 'resolved').gte('resolved_at', todayStart.toISOString()),
      ])

      setTotalConversations(convRes.count || 0)
      if (agentsRes.data) {
        setTotalAgents(agentsRes.data.filter(a => a.is_active).length)
        setActiveAgents(agentsRes.data.filter(a => a.status === 'online' && a.is_active).length)
      }
      setOpenConvs(openRes.count || 0)
      if (recentRes.data) setRecentConvs(recentRes.data as any)
      setResolvedToday(resolvedRes.count || 0)
      setLoading(false)
    }
    fetchDashboard()
  }, [])

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-nos-light-gold border-l-4 border-nos-gold rounded-xl p-6">
        <h1 className="text-2xl font-bold" style={{ color: '#92400E' }}>Welcome to Nations Of Sky Support Platform</h1>
        <p className="mt-2" style={{ color: '#B45309' }}>Manage your customer conversations efficiently across all channels.</p>
      </div>

      {/* Key Metrics */}
      {loading ? (
        <div className="flex items-center justify-center py-10"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard title="Total Conversations" value={totalConversations.toLocaleString()} change="" icon={MessageCircle} iconColor="text-nos-gold" trendPositive />
          <DashboardCard title="Active Agents" value={`${activeAgents} / ${totalAgents}`} change="" icon={Users} iconColor="text-nos-teal" trendPositive />
          <DashboardCard title="Open Conversations" value={openConvs.toLocaleString()} change="" icon={Clock} iconColor="text-blue-500" trendPositive />
          <DashboardCard title="Resolved Today" value={resolvedToday.toLocaleString()} change="" icon={Star} iconColor="text-amber-500" trendPositive />
        </div>
      )}

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MetricsChart />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Conversations</h3>
          {recentConvs.length === 0 ? (
            <p className="text-sm text-gray-400">No conversations yet</p>
          ) : (
            <div className="space-y-3">
              {recentConvs.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{(c.contacts as any)?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{new Date(c.updated_at).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
