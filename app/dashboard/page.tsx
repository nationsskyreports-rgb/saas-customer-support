import { MessageCircle, Users, Clock, Star } from 'lucide-react'
import { DashboardCard } from '@/components/dashboard-card'
import { MetricsChart } from '@/components/metrics-chart'
import { RecentConversations } from '@/components/recent-conversations'

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-nos-light-gold border-l-4 border-nos-gold rounded-lg p-6">
        <h1 className="text-2xl font-bold text-foreground">Welcome to Nations Of Sky Support Platform</h1>
        <p className="text-foreground/70 mt-2">Manage your customer conversations efficiently across all channels.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Conversations"
          value="3,847"
          change="+12%"
          icon={MessageCircle}
          iconColor="text-nos-gold"
          trendPositive
        />
        <DashboardCard
          title="Active Agents"
          value="12"
          change="+3"
          icon={Users}
          iconColor="text-nos-teal"
          trendPositive
        />
        <DashboardCard
          title="Avg Response Time"
          value="2m 14s"
          change="-5%"
          icon={Clock}
          iconColor="text-blue-500"
          trendPositive
        />
        <DashboardCard
          title="Customer Satisfaction"
          value="94%"
          change="+8%"
          icon={Star}
          iconColor="text-amber-500"
          trendPositive
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
