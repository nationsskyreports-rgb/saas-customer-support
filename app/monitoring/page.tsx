'use client'

import { useRouter } from 'next/navigation'
import { Activity, AlertCircle, Clock, MessageCircle, Phone, TrendingUp } from 'lucide-react'
import { mockAgents, mockConversations, mockChannels } from '@/lib/mock-data'

export default function MonitoringPage() {
  const router = useRouter()
  const activeConversations = mockConversations.filter((c) => c.status === 'open').length
  const pendingConversations = mockConversations.filter((c) => c.status === 'pending').length
  const onlineAgents = mockAgents.filter((a) => a.status === 'online').length
  const avgResponseTime = '2 min 45 sec'

  const stats = [
    {
      title: 'Active Conversations',
      value: activeConversations,
      icon: MessageCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pending',
      value: pendingConversations,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Online Agents',
      value: onlineAgents,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Avg Response Time',
      value: avgResponseTime,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Live Monitoring</h1>
        <p className="text-muted-foreground mt-1">Real-time system status and agent activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className="bg-card rounded-lg p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`${stat.color} w-5 h-5`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Agents */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4">Active Agents</h2>
          <div className="space-y-3">
            {mockAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => router.push(`/agents?agentId=${agent.id}`)}
                className="w-full flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    {agent.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.activeConversations} active</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      agent.status === 'online'
                        ? 'bg-green-500'
                        : agent.status === 'away'
                          ? 'bg-yellow-500'
                          : agent.status === 'idle'
                            ? 'bg-gray-500'
                            : 'bg-red-500'
                    }`}
                  />
                  <span className="text-xs font-medium text-muted-foreground capitalize">
                    {agent.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Channels Status */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4">Channels</h2>
          <div className="space-y-3">
            {mockChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => router.push('/channels')}
                className="w-full flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{channel.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{channel.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {channel.status === 'active' ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs font-medium text-green-600">Active</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-xs font-medium text-red-600">Inactive</span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Queue Section */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-sm mt-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Queue (2 waiting)</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-sm font-semibold text-foreground py-3 px-4">Contact</th>
                <th className="text-left text-sm font-semibold text-foreground py-3 px-4">Phone</th>
                <th className="text-left text-sm font-semibold text-foreground py-3 px-4">Wait Time</th>
                <th className="text-left text-sm font-semibold text-foreground py-3 px-4">Channel</th>
                <th className="text-left text-sm font-semibold text-foreground py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border hover:bg-secondary/50 transition-colors">
                <td className="py-3 px-4 text-sm text-foreground">Mohammed Karim</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">+20 555 123 4567</td>
                <td className="py-3 px-4 text-sm font-medium text-green-600">0m 45s</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">Nations Of Sky</td>
                <td className="py-3 px-4">
                  <button className="px-3 py-1.5 text-sm font-semibold text-white bg-nos-gold rounded hover:bg-nos-gold/90 transition-colors">
                    Assign →
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-secondary/50 transition-colors">
                <td className="py-3 px-4 text-sm text-foreground">Omar Sayed</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">+20 111 222 3344</td>
                <td className="py-3 px-4 text-sm font-medium text-red-600">6m 30s</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">NOS Marketing</td>
                <td className="py-3 px-4">
                  <button className="px-3 py-1.5 text-sm font-semibold text-white bg-nos-gold rounded hover:bg-nos-gold/90 transition-colors">
                    Assign →
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Activity */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-sm mt-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Mohammed Karim opened new conversation</p>
              <p className="text-xs text-muted-foreground">2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
            <Activity className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Ahmed Hassan marked conversation as resolved</p>
              <p className="text-xs text-muted-foreground">8 minutes ago</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Sarah Ahmed replied to conversation</p>
              <p className="text-xs text-muted-foreground">15 minutes ago</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
            <Activity className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Karim Mahmoud went online</p>
              <p className="text-xs text-muted-foreground">22 minutes ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
