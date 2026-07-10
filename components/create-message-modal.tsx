'use client'

import { useState } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CreateMessageModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateMessageModal({ isOpen, onClose }: CreateMessageModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('general')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }

    setSaving(true)
    setError('')

    const { error: dbError } = await supabase.from('predefined_messages').insert({
      title: title.trim(),
      content: content.trim(),
      category: category.trim().toLowerCase(),
      usage_count: 0,
      is_active: true,
    })

    setSaving(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    setTitle('')
    setContent('')
    setCategory('general')
    onClose()
    window.location.reload()
  }

  const handleClose = () => {
    setTitle('')
    setContent('')
    setCategory('general')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white rounded-xl max-w-lg w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">New Pre-defined Message</h2>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Welcome Message" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300">
              <option value="greeting">Greeting</option>
              <option value="order">Order</option>
              <option value="policy">Policy</option>
              <option value="billing">Billing</option>
              <option value="closing">Closing</option>
              <option value="escalation">Escalation</option>
              <option value="general">General</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message Content *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Type your message template..." rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
            <p className="text-xs text-gray-400 mt-1">{content.length}/500</p>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={handleClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleCreate} disabled={saving || !title.trim() || !content.trim()} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: '#C0992F' }}>
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Creating...' : 'Create Message'}
          </button>
        </div>
      </div>
    </div>
  )
}
