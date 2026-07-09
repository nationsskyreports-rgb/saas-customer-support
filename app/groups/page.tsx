'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Users, Search } from 'lucide-react'
import { mockGroups } from '@/lib/mock-data'

export default function GroupsPage() {
  const [groups] = useState(mockGroups)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Groups</h1>
          <p className="text-muted-foreground mt-1">Organize customers into groups for targeted campaigns</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New Group
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-card"
          />
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Group Name</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Description</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Members</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Created By</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Created At</th>
              <th className="px-6 py-3 text-right text-sm font-bold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredGroups.map((group) => (
              <tr key={group.id} className="hover:bg-secondary/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-accent" />
                    </div>
                    <span className="font-medium text-foreground">{group.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">{group.description}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-foreground">{group.memberCount}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">{group.createdBy}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">{group.createdAt}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Group Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold text-foreground mb-4">Create New Group</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g., Seasonal Buyers"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Description</label>
                <textarea
                  placeholder="Group description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary"
                />
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
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
