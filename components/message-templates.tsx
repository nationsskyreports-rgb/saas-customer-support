'use client'

import { useState, useEffect } from 'react'
import { Trash2, Edit, Copy, RefreshCw, X, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PredefinedMessage {
  id: string
  title: string
  content: string
  category: string
  usage_count: number
  is_active: boolean
  created_at: string
}

const categoryColors: Record<string, string> = {
  greeting: '#C0992F',
  order: '#3B82F6',
  policy: '#8B5CF6',
  billing: '#EF4444',
  closing: '#00B69B',
  escalation: '#F59E0B',
  general: '#6B7280',
}

export function MessageTemplates() {
  const [messages, setMessages] = useState<PredefinedMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editMsg, setEditMsg] = useState<PredefinedMessage | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchMessages = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('predefined_messages')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('title')
    if (data) setMessages(data)
    setLoading(false)
  }

  useEffect(() => { fetchMessages() }, [])

  // Get unique categories from data
  const categories = ['all', ...Array.from(new Set(messages.map(m => m.category)))]

  const filtered = selectedCategory === 'all'
    ? messages
    : messages.filter(m => m.category === selectedCategory)

  // ─── COPY ─────────────────────────────────
  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)

    // Increment usage count
    supabase.from('predefined_messages')
      .update({ usage_count: messages.find(m => m.id === id)!.usage_count + 1 })
      .eq('id', id)
      .then(() => fetchMessages())

    setTimeout(() => setCopiedId(null), 2000)
  }

  // ─── EDIT ─────────────────────────────────
  const openEdit = (msg: PredefinedMessage) => {
    setEditMsg(msg)
    setEditTitle(msg.title)
    setEditContent(msg.content)
    setEditCategory(msg.category)
  }

  const saveEdit = async () => {
    if (!editMsg) return
    setSaving(true)
    await supabase.from('predefined_messages').update({
      title: editTitle,
      content: editContent,
      category: editCategory,
    }).eq('id', editMsg.id)
    setSaving(false)
    setEditMsg(null)
    fetchMessages()
  }

  // ─── DELETE ───────────────────────────────
  const deleteMsg = async (id: string) => {
    await supabase.from('predefined_messages').delete().eq('id', id)
    setConfirmDelete(null)
    fetchMessages()
  }

  const tabStyle = (id: string) => selectedCategory === id
    ? { backgroundColor: '#C0992F', color: '#FFFFFF', border: '2px solid #C0992F', borderRadius: '6px', padding: '6px 16px', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' as const }
    : { backgroundColor: 'transparent', color: '#6B7280', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 16px', fontWeight: '500', fontSize: '13px', whiteSpace: 'nowrap' as const }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Loading messages...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} style={tabStyle(cat)}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
            {cat === 'all' ? ` (${messages.length})` : ` (${messages.filter(m => m.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((msg) => (
          <div key={msg.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{msg.title}</h3>
                <span
                  className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{
                    backgroundColor: (categoryColors[msg.category] || '#6B7280') + '15',
                    color: categoryColors[msg.category] || '#6B7280',
                  }}
                >
                  {msg.category}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4 line-clamp-3">{msg.content}</p>

            <p className="text-xs text-gray-400 mb-4 pb-4 border-b border-gray-100">
              Used {msg.usage_count} times
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(msg.content, msg.id)}
                className="flex-1 p-2 hover:bg-amber-50 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm text-gray-700 font-medium"
              >
                <Copy className="w-4 h-4" />
                {copiedId === msg.id ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={() => openEdit(msg)} className="p-2 hover:bg-amber-50 rounded-lg transition-colors">
                <Edit className="w-4 h-4 text-gray-600" />
              </button>
              <button onClick={() => setConfirmDelete(msg.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">No messages in this category</div>
      )}

      {/* ─── EDIT MODAL ──────────────────────── */}
      {editMsg && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setEditMsg(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Edit Message</h2>
              <button onClick={() => setEditMsg(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                <input type="text" value={editCategory} onChange={e => setEditCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Content</label>
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
                <p className="text-xs text-gray-400 mt-1">{editContent.length}/500</p>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setEditMsg(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ backgroundColor: '#C0992F' }}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM ──────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Message?</h3>
            <p className="text-sm text-gray-500 mb-6">This will permanently delete this pre-defined message.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteMsg(confirmDelete)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
