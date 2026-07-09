'use client'

import { Send, CheckCircle, Eye, AlertCircle } from 'lucide-react'

export default function DeliveryReportPage() {
  const stats = [
    { label: 'Sent', value: '45,230', icon: Send, color: 'text-blue-500' },
    { label: 'Delivered', value: '44,100', subtitle: '97.5%', icon: CheckCircle, color: 'text-green-500' },
    { label: 'Read', value: '38,200', subtitle: '84.5%', icon: Eye, color: 'text-purple-500' },
    { label: 'Failed', value: '1,130', subtitle: '2.5%', icon: AlertCircle, color: 'text-red-500' },
  ]

  const dailyData = [
    { date: 'Today', sent: 3240, delivered: 3180, read: 2890, failed: 60 },
    { date: 'Yesterday', sent: 2890, delivered: 2810, read: 2450, failed: 80 },
    { date: '2 days ago', sent: 3120, delivered: 3050, read: 2680, failed: 70 },
    { date: '3 days ago', sent: 2950, delivered: 2870, read: 2520, failed: 80 },
    { date: '4 days ago', sent: 3450, delivered: 3380, read: 3010, failed: 70 },
    { date: '5 days ago', sent: 3180, delivered: 3100, read: 2750, failed: 80 },
    { date: '6 days ago', sent: 2720, delivered: 2650, read: 2340, failed: 70 },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Delivery Report</h1>
        <p className="text-muted-foreground mt-1">Message delivery statistics and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                {stat.subtitle && <p className="text-xs text-nos-gold font-semibold mt-1">{stat.subtitle}</p>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Daily Breakdown */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-semibold text-foreground">Daily Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-nos-light-gold border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Date</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Sent</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Delivered</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Read</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Failed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dailyData.map((row, idx) => (
                <tr key={idx} className="hover:bg-nos-light-gold transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{row.date}</td>
                  <td className="px-6 py-4 text-sm text-right text-foreground">{row.sent.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right text-green-600">{row.delivered.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right text-purple-600">{row.read.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right text-red-600">{row.failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
