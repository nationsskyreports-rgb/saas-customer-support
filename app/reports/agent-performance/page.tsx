'use client'

import { Star, Clock, CheckCircle } from 'lucide-react'

export default function AgentPerformanceReportPage() {
  const agents = [
    {
      id: 1,
      name: 'Sarah Ahmed',
      handled: 124,
      resolved: 118,
      avgResponse: '1m 42s',
      avgHandle: '8m 20s',
      onlineHrs: 8.5,
      score: 94,
      isTopPerformer: true,
    },
    {
      id: 2,
      name: 'Mohamed Hassan',
      handled: 98,
      resolved: 92,
      avgResponse: '2m 15s',
      avgHandle: '9m 10s',
      onlineHrs: 8,
      score: 87,
      isTopPerformer: false,
    },
    {
      id: 3,
      name: 'Layla Ibrahim',
      handled: 115,
      resolved: 109,
      avgResponse: '1m 58s',
      avgHandle: '8m 45s',
      onlineHrs: 8.5,
      score: 91,
      isTopPerformer: false,
    },
    {
      id: 4,
      name: 'Ahmed Karim',
      handled: 82,
      resolved: 76,
      avgResponse: '2m 45s',
      avgHandle: '9m 50s',
      onlineHrs: 7.5,
      score: 79,
      isTopPerformer: false,
    },
    {
      id: 5,
      name: 'Nour Mostafa',
      handled: 105,
      resolved: 98,
      avgResponse: '2m 20s',
      avgHandle: '8m 55s',
      onlineHrs: 8,
      score: 85,
      isTopPerformer: false,
    },
  ]

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100'
    if (score >= 80) return 'bg-blue-100'
    return 'bg-yellow-100'
  }

  const getScoreTextColor = (score: number) => {
    if (score >= 90) return 'text-green-700'
    if (score >= 80) return 'text-blue-700'
    return 'text-yellow-700'
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Agent Performance Report</h1>
        <p className="text-muted-foreground mt-1">Individual agent metrics and efficiency scores</p>
      </div>

      {/* Top Performer Card */}
      <div className="bg-gradient-to-r from-nos-gold to-nos-gold/80 rounded-xl p-8 text-white border-4 border-nos-gold">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold opacity-90">TOP PERFORMER</p>
            <h2 className="text-3xl font-bold mt-2">{agents[0].name}</h2>
            <p className="text-sm mt-4 opacity-90">Performance Score: {agents[0].score}/100</p>
          </div>
          <Star className="w-12 h-12" />
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-nos-light-gold border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Agent</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Handled</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Resolved</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Avg Response</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Avg Handle</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Online Hrs</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agents.map((agent) => (
                <tr
                  key={agent.id}
                  className={`${agent.isTopPerformer ? 'bg-nos-light-gold/50' : 'hover:bg-nos-light-gold'} transition-colors`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {agent.name}
                    {agent.isTopPerformer && <span className="ml-2 text-xs font-bold text-nos-gold">★ TOP</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-foreground">{agent.handled}</td>
                  <td className="px-6 py-4 text-sm text-right text-foreground flex items-center justify-end gap-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {agent.resolved}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-foreground">{agent.avgResponse}</td>
                  <td className="px-6 py-4 text-sm text-right text-foreground">{agent.avgHandle}</td>
                  <td className="px-6 py-4 text-sm text-right text-foreground">{agent.onlineHrs}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getScoreColor(agent.score)}`}>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-nos-gold h-2 rounded-full transition-all"
                          style={{ width: `${agent.score}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold ${getScoreTextColor(agent.score)}`}>
                        {agent.score}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
