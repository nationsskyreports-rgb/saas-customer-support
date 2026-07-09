'use client'

import Link from 'next/link'
import { Download, ArrowLeft, Calendar } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const weeklyData = [
  { day: 'Mon', conversations: 145, resolved: 132, pending: 13 },
  { day: 'Tue', conversations: 168, resolved: 152, pending: 16 },
  { day: 'Wed', conversations: 142, resolved: 128, pending: 14 },
  { day: 'Thu', conversations: 189, resolved: 171, pending: 18 },
  { day: 'Fri', conversations: 156, resolved: 148, pending: 8 },
  { day: 'Sat', conversations: 92, resolved: 85, pending: 7 },
  { day: 'Sun', conversations: 78, resolved: 72, pending: 6 },
]

const satisfactionData = [
  { rating: '5★', count: 245 },
  { rating: '4★', count: 189 },
  { rating: '3★', count: 65 },
  { rating: '2★', count: 23 },
  { rating: '1★', count: 12 },
]

export default function OverviewReportPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/reports" className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Overview Report</h1>
          <p className="text-muted-foreground mt-1">Week of March 10-16, 2024</p>
        </div>
      </div>

      {/* Export and Date Selection */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <input type="date" className="flex-1 bg-transparent focus:outline-none text-foreground" />
          <span className="text-muted-foreground">to</span>
          <input type="date" className="flex-1 bg-transparent focus:outline-none text-foreground" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-border">
          <p className="text-sm text-muted-foreground mb-2">Total Conversations</p>
          <p className="text-3xl font-bold text-foreground">3,847</p>
          <p className="text-xs text-green-600 mt-1">↑ 12% from last month</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-border">
          <p className="text-sm text-muted-foreground mb-2">Resolved</p>
          <p className="text-3xl font-bold text-foreground">3,210</p>
          <p className="text-xs text-green-600 mt-1">83.4% resolution rate</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-border">
          <p className="text-sm text-muted-foreground mb-2">Avg Response Time</p>
          <p className="text-3xl font-bold text-foreground">2m 14s</p>
          <p className="text-xs text-green-600 mt-1">↓ 5% improvement</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-border">
          <p className="text-sm text-muted-foreground mb-2">Customer Satisfaction</p>
          <p className="text-3xl font-bold text-nos-gold">4.8★</p>
          <p className="text-xs text-nos-gold font-semibold mt-1">1,456 ratings</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">Conversations Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="conversations" stroke="#00B69B" strokeWidth={2} dot={{ fill: '#00B69B', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">Customer Satisfaction Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={satisfactionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="rating" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#00B69B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Daily Breakdown</h3>
        </div>
        <table className="w-full">
          <thead className="bg-nos-light-gold border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Day</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Conversations</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Resolved</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Pending</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Resolution %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {weeklyData.map((row) => (
              <tr key={row.day} className="hover:bg-nos-light-gold transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-foreground">{row.day}</td>
                <td className="px-6 py-4 text-sm text-foreground">{row.conversations}</td>
                <td className="px-6 py-4 text-sm text-green-600 font-medium">{row.resolved}</td>
                <td className="px-6 py-4 text-sm text-yellow-600 font-medium">{row.pending}</td>
                <td className="px-6 py-4 text-sm font-medium text-foreground">
                  {((row.resolved / row.conversations) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
