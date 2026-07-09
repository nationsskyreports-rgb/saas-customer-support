'use client'

import { mockAgents } from '@/lib/mock-data'
import { TrendingUp, Target, Zap } from 'lucide-react'

export default function AgentStatusesPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-700'
      case 'idle':
        return 'bg-gray-100 text-gray-700'
      case 'away':
        return 'bg-yellow-100 text-yellow-700'
      case 'offline':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'idle':
        return 'bg-gray-500'
      case 'away':
        return 'bg-yellow-500'
      case 'offline':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Agent Statuses</h1>
        <p className="text-muted-foreground mt-1">Real-time status and performance metrics for all agents</p>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {mockAgents.map((agent) => (
          <div
            key={agent.id}
            className="bg-card rounded-lg p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold">
                  {agent.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{agent.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{agent.role}</p>
                </div>
              </div>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(agent.status)}`}
              >
                <div className={`w-2 h-2 rounded-full ${getStatusBadgeColor(agent.status)}`} />
                {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  <span className="text-xs font-medium text-muted-foreground">Active Conversations</span>
                </div>
                <span className="font-bold text-foreground">{agent.activeConversations}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent" />
                  <span className="text-xs font-medium text-muted-foreground">Resolved Today</span>
                </div>
                <span className="font-bold text-foreground">{agent.resolvedToday}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-xs font-medium text-muted-foreground">Satisfaction</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-foreground">{agent.satisfaction.toFixed(1)}</span>
                  <span className="text-xs text-yellow-500">★</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Email</p>
              <p className="text-xs font-medium text-foreground break-all">{agent.email}</p>
            </div>

            {agent.team && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">Team</p>
                <p className="text-xs font-medium text-foreground">{agent.team}</p>
              </div>
            )}

            <button className="w-full mt-4 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-sm font-medium text-foreground">
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Agents</p>
          <p className="text-2xl font-bold text-foreground">{mockAgents.length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Online</p>
          <p className="text-2xl font-bold text-green-600">{mockAgents.filter((a) => a.status === 'online').length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Idle</p>
          <p className="text-2xl font-bold text-gray-600">{mockAgents.filter((a) => a.status === 'idle').length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Offline</p>
          <p className="text-2xl font-bold text-red-600">{mockAgents.filter((a) => a.status === 'offline').length}</p>
        </div>
      </div>
    </div>
  )
}
