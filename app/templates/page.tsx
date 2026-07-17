'use client'

import { useState, useEffect } from 'react'
import { Plus, Copy, Edit2, Trash2, Search, Filter, RefreshCw, X, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToasts, Toasts } from '@/components/ui/toasts'

interface Template { id: string; name: string; category: string; language: string; content: string; created_at: string }

const categoryColors: Record<string, string> = {
  greeting: 'bg-blue-100 text-blue-700',
  order: 'bg-green-100 text-green-700',
  policy: 'bg-purple-100 text-purple-700',
  billing: 'bg-orange-100 text-orange-700',
  closing: 'bg-pink-100 text-pink-700',
  escalation: 'bg-red-100 text-red-700',
}

export default function TemplatesPage() {
  const { toasts, showToast, dismissToast } = useToasts()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Template | null>(null)
  const [tName, setTName] = useState('')
  const [tCategory, setTCategory] = useState('greeting')
  const [tLanguage, setTLanguage] = useState('ar')
  const [tContent, setTContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchTemplates = async () => {
    setLoading(true)
    const { data } = await supabase.from('templates').select('*').order('created_at')
    if (data) setTemplates(data)
    setLoading(false)
  }

  useEffect(() => { fetchTemplates() }, [])

  const categories = ['all', ...new Set(templates.map(t => t.category))]

  const filtered = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory
    return matchesSearch && matchesCat
  })

  const openCreate = () => { setEditItem(null); setTName(''); setTCategory('greeting'); setTLanguage('ar'); setTContent(''); setShowModal(true) }
  const openEdit = (t: Template) => { setEditItem(t); setTName(t.name); setTCategory(t.category); setTLanguage(t.language); setTContent(t.content); setShowModal(true) }

  const handleSave = async () => {
    if (!tName.trim() || !tContent.trim()) return
    setSaving(true)
    let err = null
    if (editItem) {
      const { data, error } = await supabase.from('templates').update({ name: tName.trim(), category: tCategory, language: tLanguage, content: tContent.trim() }).eq('id', editItem.id).select('id')
      err = error?.message || (!data || data.length === 0 ? 'no rows updated (check permissions)' : null)
    } else {
      const { error } = await supabase.from('templates').insert({ name: tName.trim(), category: tCategory, language: tLanguage, content: tContent.trim() })
      err = error?.message || null
    }
    setSaving(false)
    if (err) { showToast('error', `Save failed: ${err}`); return }
    setShowModal(false)
    showToast('success', editItem ? 'Template updated' : 'Template created')
    fetchTemplates()
  }

  const handleDelete = async (id: string) => {
    const { data, error } = await supabase.from('templates').delete().eq('id', id).select('id')
    setConfirmDelete(null)
    if (error || !data || data.length === 0) {
      showToast('error', `Delete failed: ${error?.message || 'no rows deleted (check permissions)'}`)
      return
    }
    showToast('success', 'Template deleted')
    fetchTemplates()
  }

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /><span className="ml-3 text-gray-500">Loading templates...</span></div>
  }

  return (
    <div className="p-8">
      <Toasts toasts={toasts} dismiss={dismissToast} />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Message Templates</h1>
          <p className="text-muted-foreground mt-1">Pre-designed message templates for quick responses</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-colors" style={{ backgroundColor: '#00B69B' }}>
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search templates..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm appearance-none bg-white">
            {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(template => (
          <div key={template.id} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="mb-3">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-bold text-gray-900 flex-1">{template.name}</h3>
                <span className={`inline-flex px-2 py-1 rounded text-xs font-bold whitespace-nowrap ml-2 ${categoryColors[template.category] || 'bg-gray-100 text-gray-700'}`}>
                  {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                </span>
              </div>
              <p className="text-xs text-gray-400">Language: {template.language.toUpperCase()}</p>
            </div>
            <div className="flex-1 mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 line-clamp-4" dir="auto">{template.content}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleCopy(template.id, template.content)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${copiedId === template.id ? 'bg-green-100 text-green-700' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                <Copy className="w-4 h-4" />
                {copiedId === template.id ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={() => openEdit(template)} className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"><Edit2 className="w-4 h-4 text-gray-500" /></button>
              <button onClick={() => setConfirmDelete(template.id)} className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{editItem ? 'Edit Template' : 'New Template'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Template Name *</label>
                <input type="text" value={tName} onChange={e => setTName(e.target.value)} placeholder="e.g. Payment Reminder" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                  <select value={tCategory} onChange={e => setTCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="greeting">Greeting</option><option value="order">Order</option><option value="policy">Policy</option>
                    <option value="billing">Billing</option><option value="closing">Closing</option><option value="escalation">Escalation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Language</label>
                  <select value={tLanguage} onChange={e => setTLanguage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="ar">Arabic</option><option value="en">English</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message Content *</label>
                <textarea value={tContent} onChange={e => setTContent(e.target.value)} rows={6} placeholder="Write your template message here..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" dir="auto" />
                <p className="text-xs text-gray-400 mt-1">Use {'{{variable_name}}'} for dynamic content</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !tName.trim() || !tContent.trim()} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: '#00B69B' }}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Template?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
