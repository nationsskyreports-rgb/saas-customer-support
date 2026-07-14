'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, RefreshCw, X, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface LogCategory {
  id: string
  name: string
  description: string
  created_at: string
}

export default function LogCategoriesPage() {
  const [categories, setCategories] = useState<LogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<LogCategory | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchCategories = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('log_categories')
      .select('*')
      .order('created_at')
    if (data) setCategories(data)
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  const openCreate = () => {
    setEditItem(null)
    setName('')
    setDescription('')
    setShowModal(true)
  }

  const openEdit = (cat: LogCategory) => {
    setEditItem(cat)
    setName(cat.name)
    setDescription(cat.description)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    if (editItem) {
      await supabase.from('log_categories').update({ name: name.trim(), description: description.trim() }).eq('id', editItem.id)
    } else {
      await supabase.from('log_categories').insert({ name: name.trim(), description: description.trim() })
    }
    setSaving(false)
    setShowModal(false)
    fetchCategories()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('log_categories').delete().eq('id', id)
    setConfirmDelete(null)
    fetchCategories()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Loading categories...</span>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Log Category Types</h1>
          <p className="text-muted-foreground mt-1">Manage activity log categories</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-colors" style={{ backgroundColor: '#00B69B' }}>
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Created</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-emerald-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{cat.description}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(cat.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button onClick={() => setConfirmDelete(cat.id)} className="p-1.5 hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No categories found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{editItem ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Escalation" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !name.trim()} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: '#00B69B' }}>
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
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Category?</h3>
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
