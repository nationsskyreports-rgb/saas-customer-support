'use client'

import { Clock, CheckCircle, AlertCircle, LogIn, ArrowRight } from 'lucide-react'

export default function ActivityLogPage() {
  const activities = [
    {
      id: 1,
      actor: 'Sarah Ahmed',
      action: 'resolved conversation',
      metadata: '3 messages, 8m 42s',
      timestamp: '2 min ago',
      type: 'resolution',
      icon: CheckCircle,
    },
    {
      id: 2,
      actor: 'Mohamed Hassan',
      action: 'changed status to Busy',
      metadata: 'Manual status change',
      timestamp: '15 min ago',
      type: 'status',
      icon: AlertCircle,
    },
    {
      id: 3,
      actor: 'Layla Ibrahim',
      action: 'assigned conversation to Ahmed Karim',
      metadata: 'Customer: Mohammed Karim',
      timestamp: '1h ago',
      type: 'assignment',
      icon: ArrowRight,
    },
    {
      id: 4,
      actor: 'System',
      action: 'new conversation from +20 123 456 7890',
      metadata: 'NOS WhatsApp Channel',
      timestamp: '1h ago',
      type: 'system',
      icon: Clock,
    },
    {
      id: 5,
      actor: 'Nour Mostafa',
      action: 'logged in',
      metadata: 'Agent login',
      timestamp: '2h ago',
      type: 'login',
      icon: LogIn,
    },
    {
      id: 6,
      actor: 'Admin',
      action: 'created new agent',
      metadata: 'Fatima Sayed - Support Team',
      timestamp: '3h ago',
      type: 'system',
      icon: Clock,
    },
  ]

  const filterTypes = ['All', 'Status Change', 'Assignment', 'Resolution', 'Login', 'Settings']

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Activity Log</h1>
        <p className="text-muted-foreground mt-1">Complete audit trail of all system activities</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filterTypes.map((filter) => (
          <button
            key={filter}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium text-sm transition-colors ${
              filter === 'All'
                ? 'bg-nos-gold text-white'
                : 'bg-nos-light-gold text-foreground hover:bg-nos-gold/20'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon
          return (
            <div key={activity.id} className="bg-white border border-border rounded-xl p-6 hover:shadow-md transition-shadow flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-nos-light-gold flex items-center justify-center">
                  <Icon className="w-5 h-5 text-nos-gold" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="font-semibold text-foreground">{activity.actor}</p>
                  <p className="text-muted-foreground text-sm">{activity.action}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{activity.metadata}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 pt-8">
        <button className="px-3 py-2 rounded-lg border border-border hover:bg-nos-light-gold transition-colors text-sm">←</button>
        {[1, 2, 3, 4, 5].map((page) => (
          <button
            key={page}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              page === 1
                ? 'bg-nos-gold text-white'
                : 'border border-border hover:bg-nos-light-gold'
            }`}
          >
            {page}
          </button>
        ))}
        <button className="px-3 py-2 rounded-lg border border-border hover:bg-nos-light-gold transition-colors text-sm">→</button>
      </div>
    </div>
  )
}
