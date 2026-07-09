import { BarChart3, MessageCircle, Users, Clock } from 'lucide-react'
import { DashboardCard } from '@/components/dashboard-card'
import { MetricsChart } from '@/components/metrics-chart'
import { RecentConversations } from '@/components/recent-conversations'

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s your support overview.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Conversations"
          value="1,284"
          change="+12.5%"
          icon={MessageCircle}
          color="bg-primary/10"
        />
        <DashboardCard
          title="Active Agents"
          value="8"
          change="+1"
          icon={Users}
          color="bg-accent/10"
        />
        <DashboardCard
          title="Avg Response Time"
          value="2m 14s"
          change="-8%"
          icon={Clock}
          color="bg-green-100"
        />
        <DashboardCard
          title="Customer Satisfaction"
          value="94%"
          change="+2%"
          icon={BarChart3}
          color="bg-blue-100"
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MetricsChart />
        </div>
        <div>
          <RecentConversations />
        </div>
      </div>
    </div>
  )
}
