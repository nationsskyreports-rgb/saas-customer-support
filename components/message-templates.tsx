'use client'

import { useState } from 'react'
import { Trash2, Edit, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

const templates = [
  {
    id: 1,
    title: 'Greeting',
    category: 'greeting',
    content: 'Hello! Welcome to Nations Of Sky support. How can I help you today?',
    usageCount: 342,
  },
  {
    id: 2,
    title: 'Order Follow-up',
    category: 'order',
    content: "We're following up on your recent order. Is there anything we can help with?",
    usageCount: 521,
  },
  {
    id: 3,
    title: 'Policy Info',
    category: 'policy',
    content: 'For more information about our policies, please visit our website or contact support.',
    usageCount: 198,
  },
  {
    id: 4,
    title: 'Billing',
    category: 'billing',
    content: 'Regarding your billing inquiry, our team will review and get back to you shortly.',
    usageCount: 87,
  },
  {
    id: 5,
    title: 'Closing',
    category: 'closing',
    content: 'Thank you for contacting NOS. Have a great day!',
    usageCount: 456,
  },
  {
    id: 6,
    title: 'Escalation',
    category: 'escalation',
    content: "I'm escalating your case to our specialist team who will contact you shortly.",
    usageCount: 124,
  },
]

const categories = [
  { id: 'all', label: 'All' },
  { id: 'greeting', label: 'Greeting' },
  { id: 'order', label: 'Order' },
  { id: 'policy', label: 'Policy' },
  { id: 'billing', label: 'Billing' },
  { id: 'closing', label: 'Closing' },
  { id: 'escalation', label: 'Escalation' },
]

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    greeting: 'bg-nos-gold/10 text-nos-gold',
    order: 'bg-nos-gold/10 text-nos-gold',
    policy: 'bg-nos-gold/10 text-nos-gold',
    billing: 'bg-nos-gold/10 text-nos-gold',
    closing: 'bg-nos-gold/10 text-nos-gold',
    escalation: 'bg-nos-gold/10 text-nos-gold',
  }
  return colors[category] || 'bg-nos-gold/10 text-nos-gold'
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
            className={`px-4 py-1.5 rounded whitespace-nowrap font-semibold text-sm transition-colors ${
              selectedCategory === cat.id
                ? 'bg-nos-gold text-white'
                : 'bg-transparent text-gray-600 border border-gray-200 hover:bg-nos-gold/5 hover:border-nos-gold hover:text-nos-gold'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground mb-2">{template.title}</h3>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getCategoryColor(template.category)}`}>
                  {template.category}
                </span>
              </div>
            </div>

            {/* Content */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {template.content}
            </p>

            {/* Stats */}
            <p className="text-xs text-muted-foreground mb-4 pb-4 border-b border-border">
              Used {template.usageCount} times
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(template.content, template.id)}
                className="flex-1 p-2 hover:bg-nos-light-gold rounded-lg transition-colors flex items-center justify-center gap-1 text-sm text-foreground font-medium"
              >
                <Copy className="w-4 h-4" />
                {copiedId === template.id ? 'Copied!' : 'Copy'}
              </button>
              <button className="p-2 hover:bg-nos-light-gold rounded-lg transition-colors">
                <Edit className="w-4 h-4 text-foreground" />
              </button>
              <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
