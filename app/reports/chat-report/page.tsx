'use client'

import { useState, useEffect } from 'react'

export default function ChatReportPage() {
  const [hourlyData, setHourlyData] = useState<Array<{hour: string, conversations: number, isPeak: boolean}>>([])

  useEffect(() => {
    const data = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      conversations: Math.floor(Math.random() * 150 + 50),
      isPeak: i >= 9 && i <= 17,
    }))
    setHourlyData(data)
  }, [])

  const maxVal = Math.max(...hourlyData.map(d => d.conversations), 1)

  const topConversations = [
    { id: 1, contact: 'Ahmed Hassan', phone: '+20 123 456 7890', agent: 'Sarah Ahmed', duration: '18m 32s', messages: 24, channel: 'WhatsApp' },
    { id: 2, contact: 'Fatima Al-Rashid', phone: '+20 987 654 3210', agent: 'Mohamed Hassan', duration: '12m 15s', messages: 18, channel: 'WhatsApp' },
    { id: 3, contact: 'Omar Sayed', phone: '+20 555 123 4567', agent: 'Layla Ibrahim', duration: '25m 48s', messages: 31, channel: 'WhatsApp' },
    { id: 4, contact: 'Nour Mostafa', phone: '+20 222 333 4444', agent: 'Ahmed Karim', duration: '9m 20s', messages: 12, channel: 'WhatsApp' },
    { id: 5, contact: 'Salma Fathy', phone: '+20 666 777 8888', agent: 'Sarah Ahmed', duration: '21m 10s', messages: 28, channel: 'WhatsApp' },
    { id: 6, contact: 'Karim Ali', phone: '+20 111 222 3333', agent: 'Mohamed Hassan', duration: '16m 45s', messages: 22, channel: 'WhatsApp' },
    { id: 7, contact: 'Maryam Ehab', phone: '+20 444 555 6666', agent: 'Layla Ibrahim', duration: '14m 30s', messages: 19, channel: 'WhatsApp' },
    { id: 8, contact: 'Ibrahim Nassar', phone: '+20 999 888 7777', agent: 'Ahmed Karim', duration: '11m 15s', messages: 15, channel: 'WhatsApp' },
    { id: 9, contact: 'Dina Hossam', phone: '+20 333 444 5555', agent: 'Sarah Ahmed', duration: '19m 50s', messages: 26, channel: 'WhatsApp' },
    { id: 10, contact: 'Tariq Hassan', phone: '+20 777 888 9999', agent: 'Mohamed Hassan', duration: '13m 40s', messages: 17, channel: 'WhatsApp' },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Chat Report</h1>
        <p className="text-gray-500 mt-1">Detailed conversation analytics and volume</p>
      </div>

      {/* Hourly Volume Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-6">Hourly Conversation Volume (Today)</h2>
        <div className="flex items-end gap-[3px]" style={{ height: '256px' }}>
          {hourlyData.map((data, idx) => {
            const barHeight = (data.conversations / maxVal) * 230
            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className="w-full rounded-t-sm hover:opacity-80 cursor-pointer transition-opacity"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: data.isPeak ? '#C0992F' : '#00B69B',
                    minHeight: '4px',
                  }}
                  title={`${data.hour}: ${data.conversations} conversations`}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-3">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
        <div className="flex items-center gap-4 mt-3 justify-center">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: '#C0992F' }} /> Peak Hours (9AM-5PM)
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: '#00B69B' }} /> Off-Peak
          </span>
        </div>
      </div>

      {/* Top Conversations Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Top Conversations (Today)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: '#FFF9ED' }} className="border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Agent</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Duration</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Messages</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Channel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topConversations.map((conv) => (
                <tr key={conv.id} className="hover:bg-amber-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{conv.contact}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{conv.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{conv.agent}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900">{conv.duration}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900">{conv.messages}</td>
                  <td className="px-6 py-4 text-sm text-center font-semibold" style={{ color: '#00B69B' }}>{conv.channel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
