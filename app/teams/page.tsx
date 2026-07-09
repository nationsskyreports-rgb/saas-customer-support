'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Users } from 'lucide-react'
import { mockTeams, mockAgents } from '@/lib/mock-data'

export default function TeamsPage() {
  const [teams] = useState(mockTeams)
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teams Management</h1>
          <p className="text-muted-foreground mt-1">Organize agents into teams for better management</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New Team
        </button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const teamAgents = mockAgents.filter((a) => a.team === team.name)
          return (
            <div key={team.id} className="bg-card rounded-lg p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{team.name}</h3>
                    <p className="text-xs text-muted-foreground">Supervisor: {team.supervisor}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-secondary rounded">
                  <span className="text-sm text-muted-foreground">Members</span>
                  <span className="text-sm font-bold text-foreground">{team.agentCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-secondary rounded">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700">
                    {team.status.charAt(0).toUpperCase() + team.status.slice(1)}
                  </span>
                </div>
              </div>

              {teamAgents.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-bold text-muted-foreground mb-2">Team Members</p>
                  <div className="space-y-2">
                    {teamAgents.map((agent) => (
                      <div key={agent.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold">
                          {agent.avatar}
                        </div>
                        <span className="text-xs text-foreground">{agent.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Create Team Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold text-foreground mb-4">Create New Team</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Team Name</label>
                <input
                  type="text"
                  placeholder="e.g., Team Gamma"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Supervisor</label>
                <select className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary">
                  <option>Select supervisor</option>
                  {mockAgents.filter((a) => a.role === 'supervisor' || a.role === 'admin').map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-foreground border border-border rounded-lg hover:bg-secondary transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium"
                >
                  Create Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
