'use client'

import Link from 'next/link'
import { BarChart3, Users, MessageCircle, Send, Activity } from 'lucide-react'

export default function ReportsPage() {
  const reportTypes = [
    {
      title: 'Overview Report',
      description: 'High-level metrics and KPIs for the entire platform',
      icon: BarChart3,
      href: '/reports/overview',
    },
    {
      title: 'Agent Performance',
      description: 'Individual agent metrics, response times, and satisfaction scores',
      icon: Users,
      href: '/reports/agent-performance',
    },
    {
      title: 'Chat Report',
      description: 'Detailed conversation analytics and chat statistics',
      icon: MessageCircle,
      href: '/reports/chat-report',
    },
    {
      title: 'Delivery Report',
      description: 'Message delivery status and performance metrics',
      icon: Send,
      href: '/reports/delivery-report',
    },
    {
      title: 'Activity Log',
      description: 'Complete audit trail of all system activities and changes',
      icon: Activity,
      href: '/reports/activity-log',
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground mt-1">Analyze and export detailed reports about your support operations</p>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon
          return (
            <Link
              key={report.href}
              href={report.href}
              className="bg-white rounded-xl p-6 border border-border shadow-sm hover:shadow-lg hover:border-nos-gold transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-nos-light-gold flex items-center justify-center mb-4 group-hover:bg-nos-gold group-hover:text-white transition-all">
                <Icon className="w-6 h-6 text-nos-gold group-hover:text-white" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-1 group-hover:text-nos-gold transition-colors">{report.title}</h3>
              <p className="text-sm text-muted-foreground">{report.description}</p>
            </Link>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-border">
          <p className="text-sm text-muted-foreground mb-2">Total Reports</p>
          <p className="text-3xl font-bold text-foreground">342</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-border">
          <p className="text-sm text-muted-foreground mb-2">This Month</p>
          <p className="text-3xl font-bold text-nos-gold">87</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-border">
          <p className="text-sm text-muted-foreground mb-2">Scheduled</p>
          <p className="text-3xl font-bold text-foreground">8</p>
        </div>
      </div>
    </div>
  )
}
