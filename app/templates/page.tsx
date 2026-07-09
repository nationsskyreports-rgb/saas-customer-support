'use client'

import { useState } from 'react'
import { Plus, Copy, Edit2, Trash2, Search, Filter } from 'lucide-react'
import { mockTemplates } from '@/lib/mock-data'

const categoryColors: { [key: string]: string } = {
  greeting: 'bg-blue-100 text-blue-700',
  order: 'bg-green-100 text-green-700',
  policy: 'bg-purple-100 text-purple-700',
  billing: 'bg-orange-100 text-orange-700',
  closing: 'bg-pink-100 text-pink-700',
  escalation: 'bg-red-100 text-red-700',
}

export default function TemplatesPage() {
  const [templates] = useState(mockTemplates)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const categories = ['all', ...new Set(templates.map((t) => t.category))]

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Message Templates</h1>
          <p className="text-muted-foreground mt-1">Pre-designed message templates for quick responses</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-card"
            />
          </div>
        </div>
        <div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-card appearance-none"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-card rounded-lg p-6 border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="mb-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-foreground flex-1">{template.name}</h3>
                <span
                  className={`inline-flex px-2 py-1 rounded text-xs font-bold whitespace-nowrap ml-2 ${
                    categoryColors[template.category] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Created by {template.createdBy} on {template.createdAt}
              </p>
            </div>

            <div className="flex-1 mb-4 p-3 bg-secondary rounded-lg">
              <p className="text-sm text-foreground line-clamp-4">{template.content}</p>
            </div>

            <div className="flex items-center justify-between mb-4 p-2 bg-secondary rounded">
              <span className="text-xs text-muted-foreground">Used {template.usageCount} times</span>
              <div className="w-16 h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{
                    width: `${Math.min((template.usageCount / 100) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(template.id, template.content)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  copiedId === template.id
                    ? 'bg-green-100 text-green-700'
                    : 'border border-border hover:bg-secondary text-foreground'
                }`}
              >
                <Copy className="w-4 h-4" />
                {copiedId === template.id ? 'Copied!' : 'Copy'}
              </button>
              <button className="px-3 py-2 border border-border rounded-lg hover:bg-secondary transition-colors">
                <Edit2 className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="px-3 py-2 border border-border rounded-lg hover:bg-secondary transition-colors">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Template Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-4">Create New Template</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Template Name</label>
                <input
                  type="text"
                  placeholder="e.g., Payment Reminder"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Category</label>
                <select className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary">
                  <option>greeting</option>
                  <option>order</option>
                  <option>policy</option>
                  <option>billing</option>
                  <option>closing</option>
                  <option>escalation</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Message Content</label>
                <textarea
                  placeholder="Write your template message here. Use {{variable_name}} for dynamic content."
                  rows={6}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tip: Use {{order_id}}, {{customer_name}}, {{tracking_id}} for dynamic variables
                </p>
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
                  Create Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
