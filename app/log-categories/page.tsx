'use client'

import { Plus, Trash2, Edit2 } from 'lucide-react'

export default function LogCategoriesPage() {
  const categories = [
    { id: 1, name: 'System Event', description: 'Automatic system operations', count: 342 },
    { id: 2, name: 'User Action', description: 'Manual user interactions', count: 1256 },
    { id: 3, name: 'Status Change', description: 'Agent status modifications', count: 891 },
    { id: 4, name: 'Assignment', description: 'Conversation assignments', count: 456 },
    { id: 5, name: 'Resolution', description: 'Conversation resolutions', count: 678 },
    { id: 6, name: 'Escalation', description: 'Escalation events', count: 123 },
  ]

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Log Category Types</h1>
          <p className="text-muted-foreground mt-1">Manage activity log categories</p>
        </div>
        <button className="bg-nos-gold text-white px-4 py-2 rounded-lg hover:bg-nos-gold/90 transition-colors flex items-center gap-2 font-semibold">
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-nos-light-gold border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Description</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Events</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-nos-light-gold transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-foreground">{cat.name}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{cat.description}</td>
                <td className="px-6 py-4 text-sm text-foreground">{cat.count}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 hover:bg-nos-light-gold rounded transition-colors">
                      <Edit2 className="w-4 h-4 text-foreground" />
                    </button>
                    <button className="p-1.5 hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
