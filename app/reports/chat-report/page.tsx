'use client'

import { Clock, MessageCircle, User, DollarSign } from 'lucide-react'

export default function ChatReportPage() {
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    conversations: Math.floor(Math.random() * 150 + 50),
    isPeak: i >= 9 && i <= 17,
  }))

  const topConversations = [
    { id: 1, contact: 'Ahmed Hassan', phone: '+20 123 456 7890', agent: 'Sarah Ahmed', duration: '18m 32s', messages: 24, channel: 'WhatsApp' },
    { id: 2, contact: 'Fatima Al-Zahra', phone: '+20 987 654 3210', agent: 'Mohamed Hassan', duration: '12m 15s', messages: 18, channel: 'WhatsApp' },
    { id: 3, contact: 'Omar Sayed', phone: '+20 555 123 4567', agent: 'Layla Ibrahim', duration: '25m 48s', messages: 31, channel: 'WhatsApp' },
    { id: 4, contact: 'Noor Mustafa', phone: '+20 222 333 4444', agent: 'Ahmed Karim', duration: '9m 20s', messages: 12, channel: 'WhatsApp' },
    { id: 5, contact: 'Salma Fathy', phone: '+20 666 777 8888', agent: 'Sarah Ahmed', duration: '21m 10s', messages: 28, channel: 'WhatsApp' },
    { id: 6, contact: 'Karim Ali', phone: '+20 111 222 3333', agent: 'Mohamed Hassan', duration: '16m 45s', messages: 22, channel: 'WhatsApp' },
    { id: 7, contact: 'Maryam Ehab', phone: '+20 444 555 6666', agent: 'Layla Ibrahim', duration: '14m 30s', messages: 19, channel: 'WhatsApp' },
    { id: 8, contact: 'Ibrahim Nassar', phone: '+20 999 888 7777', agent: 'Ahmed Karim', duration: '11m 15s', messages: 15, channel: 'WhatsApp' },
    { id: 9, contact: 'Dina Hossam', phone: '+20 333 444 5555', agent: 'Sarah Ahmed', duration: '19m 50s', messages: 26, channel: 'WhatsApp' },
    { id: 10, contact: 'Tariq Hassan', phone: '+20 777 888 9999', agent: 'Mohamed Hassan', duration: '13m 40s', messages: 17, channel: 'WhatsApp' },
  ]

  const getHourColor = (isPeak: boolean) => isPeak ? 'bg-nos-gold' : 'bg-nos-teal'

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Chat Report</h1>
        <p className="text-muted-foreground mt-1">Detailed conversation analytics and volume</p>
      </div>

      {/* Hourly Volume Chart */}
      <div className="bg-white border border-border rounded-xl p-6">
        <h2 className="font-semibold text-foreground mb-6">Hourly Conversation Volume (Today)</h2>
        <div className="space-y-2">
          {/* Bar Chart */}
          <div className="flex items-end gap-1 h-64">
            {hourlyData.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full ${getHourColor(data.isPeak)} rounded-t transition-all hover:opacity-80`}
                  style={{ height: `${(data.conversations / 200) * 100}%` }}
                  title={`${data.hour}: ${data.conversations} conversations`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-4">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
        </div>
      </div>

      {/* Top Conversations Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-semibold text-foreground">Top Conversations (Today)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-nos-light-gold border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Agent</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">Duration</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">Messages</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">Channel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topConversations.map((conv) => (
                <tr key={conv.id} className="hover:bg-nos-light-gold transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{conv.contact}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{conv.phone}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{conv.agent}</td>
                  <td className="px-6 py-4 text-sm text-center text-foreground">{conv.duration}</td>
                  <td className="px-6 py-4 text-sm text-center text-foreground">{conv.messages}</td>
                  <td className="px-6 py-4 text-sm text-center text-nos-teal font-semibold">{conv.channel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
