'use client'

import Link from 'next/link'
import { BarChart3, Users, MessageCircle, TrendingUp, Clock, Activity } from 'lucide-react'

export default function ReportsPage() {
  const reportTypes = [
    {
      title: 'Overview Report',
      description: 'High-level metrics and KPIs for the entire platform',
      icon: BarChart3,
      href: '/reports/overview',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Agent Performance',
      description: 'Individual agent metrics, response times, and satisfaction scores',
      icon: Users,
      href: '/reports/agent-performance',
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'Chat Report',
      description: 'Detailed conversation analytics and chat statistics',
      icon: MessageCircle,
      href: '/reports/chat-report',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Delivery Report',
      description: 'Message delivery status and performance metrics',
      icon: TrendingUp,
      href: '/reports/delivery-report',
      color: 'bg-orange-50 text-orange-600',
    },
    {
      title: 'Activity Log',
      description: 'Complete audit trail of all system activities and changes',
      icon: Activity,
      href: '/reports/activity-log',
      color: 'bg-pink-50 text-pink-600',
    },
    {
      title: 'Custom Report',
      description: 'Build your own custom report with selected metrics',
      icon: Clock,
      href: '/reports/custom',
      color: 'bg-indigo-50 text-indigo-600',
    },
  ]

  return (
    <div className="p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground mt-1">Analyze and export detailed reports about your support operations</p>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {reportTypes.map((report) => {
          const Icon = report.icon
          return (
            <Link
              key={report.href}
              href={report.href}
              className="bg-card rounded-lg p-6 border border-border shadow-sm hover:shadow-lg transition-shadow group"
            >
              <div className={`w-12 h-12 rounded-lg ${report.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-1">{report.title}</h3>
              <p className="text-sm text-muted-foreground">{report.description}</p>
            </Link>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg p-6 border border-border">
          <p className="text-sm text-muted-foreground mb-2">Total Reports Generated</p>
          <p className="text-3xl font-bold text-foreground">342</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-border">
          <p className="text-sm text-muted-foreground mb-2">Last Report Generated</p>
          <p className="text-lg font-bold text-foreground">Today at 2:45 PM</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-border">
          <p className="text-sm text-muted-foreground mb-2">Scheduled Reports</p>
          <p className="text-3xl font-bold text-foreground">8</p>
        </div>
      </div>
    </div>
  )
}
