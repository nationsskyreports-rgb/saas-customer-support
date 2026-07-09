'use client'

import { useState } from 'react'
import { Trash2, Edit, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

const templates = [
  {
    id: 1,
    title: 'Welcome Message',
    category: 'greeting',
    content: 'Hello! Thank you for reaching out. How can we help you today?',
    usageCount: 342,
  },
  {
    id: 2,
    title: 'Order Status',
    category: 'order',
    content: 'Your order is being processed and will ship within 24 hours. You&apos;ll receive a tracking number via email.',
    usageCount: 521,
  },
  {
    id: 3,
    title: 'Return Policy',
    category: 'policy',
    content: 'We offer returns within 30 days of purchase. Please visit our returns page or contact support for assistance.',
    usageCount: 198,
  },
  {
    id: 4,
    title: 'Payment Issue',
    category: 'billing',
    content: 'I apologize for the payment issue. Let me check your account right away and resolve this for you.',
    usageCount: 87,
  },
  {
    id: 5,
    title: 'Closing Message',
    category: 'closing',
    content: 'Is there anything else I can help you with today? Thank you for choosing us!',
    usageCount: 456,
  },
  {
    id: 6,
    title: 'Escalation',
    category: 'escalation',
    content: 'I&apos;ll escalate this to our specialist team. Someone will follow up with you within 2 hours.',
    usageCount: 124,
  },
]

const categories = [
  { id: 'all', label: 'All Templates' },
  { id: 'greeting', label: 'Greeting' },
  { id: 'order', label: 'Order' },
  { id: 'policy', label: 'Policy' },
  { id: 'billing', label: 'Billing' },
  { id: 'closing', label: 'Closing' },
  { id: 'escalation', label: 'Escalation' },
]

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    greeting: 'bg-blue-100 text-blue-800',
    order: 'bg-purple-100 text-purple-800',
    policy: 'bg-amber-100 text-amber-800',
    billing: 'bg-red-100 text-red-800',
    closing: 'bg-green-100 text-green-800',
    escalation: 'bg-pink-100 text-pink-800',
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}

export function MessageTemplates() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory)

  const handleCopy = (content: string, id: number) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium text-sm transition-colors ${
              selectedCategory === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground mb-2">{template.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(template.category)}`}>
                  {template.category}
                </span>
              </div>
            </div>

            {/* Content */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
              {template.content}
            </p>

            {/* Stats */}
            <p className="text-xs text-muted-foreground mb-4">
              Used {template.usageCount} times
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(template.content, template.id)}
                className="flex-1 p-2 hover:bg-muted rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
              >
                <Copy className="w-4 h-4" />
                {copiedId === template.id ? 'Copied!' : 'Copy'}
              </button>
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Edit className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
