'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Send, Eye, MoreVertical, RefreshCw, X, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Campaign {
  id: string; name: string; status: string; type: string
  recipient_count: number; sent_count: number; template_id: string | null
  scheduled_at: string | null; created_at: string
}

interface Template { id: string; name: string }

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Campaign | null>(null)
  const [cName, setCName] = useState('')
  const [cType, setCType] = useState('broadcast')
  const [cRecipients, setCRecipients] = useState(0)
  const [cTemplateId, setCTemplateId] = useState('')
  const [cSchedule, setCSchedule] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const [campRes, tmplRes] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('templates').select('id, name').order('name'),
    ])
    if (campRes.data) setCampaigns(campRes.data)
    if (tmplRes.data) setTemplates(tmplRes.data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'draft': return 'bg-gray-100 text-gray-700'
      case 'scheduled': return 'bg-blue-100 text-blue-700'
      case 'active': return 'bg-green-100 text-green-700'
      case 'completed': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const openCreate = () => { setEditItem(null); setCName(''); setCType('broadcast'); setCRecipients(0); setCTemplateId(''); setCSchedule(''); setShowModal(true) }
  const openEdit = (c: Campaign) => { setEditItem(c); setCName(c.name); setCType(c.type); setCRecipients(c.recipient_count); setCTemplateId(c.template_id || ''); setCSchedule(c.scheduled_at || ''); setShowModal(true) }

  const handleSave = async () => {
    if (!cName.trim()) return
    setSaving(true)
    const payload: any = {
      name: cName.trim(), type: cType, recipient_count: cRecipients,
      template_id: cTemplateId || null,
      scheduled_at: cSchedule || null,
    }
    if (editItem) {
      await supabase.from('campaigns').update(payload).eq('id', editItem.id)
    } else {
      payload.status = 'draft'
      payload.sent_count = 0
      await supabase.from('campaigns').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    fetchData()
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('campaigns').update({ status }).eq('id', id)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('campaigns').delete().eq('id', id)
    setConfirmDelete(null)
    fetchData()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /><span className="ml-3 text-gray-500">Loading campaigns...</span></div>
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Create and manage broadcast campaigns</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-colors" style={{ backgroundColor: '#00B69B' }}>
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Campaign</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Recipients</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {campaigns.map(c => {
              const pct = c.recipient_count > 0 ? Math.round((c.sent_count / c.recipient_count) * 100) : 0
              return (
                <tr key={c.id} className="hover:bg-emerald-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 capitalize">{c.type}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(c.status)}`}>
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.recipient_count.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#00B69B' }} />
                      </div>
                      <span className="text-sm font-medium text-gray-900 min-w-fit">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                      {c.status === 'draft' && (
                        <button onClick={() => updateStatus(c.id, 'scheduled')} className="px-2 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded hover:bg-blue-50">Schedule</button>
                      )}
                      {c.status === 'scheduled' && (
                        <button onClick={() => updateStatus(c.id, 'active')} className="px-2 py-1 text-xs font-medium text-green-600 border border-green-200 rounded hover:bg-green-50">Launch</button>
                      )}
                      <button onClick={() => openEdit(c)} className="p-2 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                      <button onClick={() => setConfirmDelete(c.id)} className="p-2 hover:bg-gray-100 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {campaigns.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No campaigns found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{editItem ? 'Edit Campaign' : 'New Campaign'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Campaign Name *</label>
                <input type="text" value={cName} onChange={e => setCName(e.target.value)} placeholder="e.g. Summer Sale 2024" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                  <select value={cType} onChange={e => setCType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="broadcast">Broadcast</option><option value="targeted">Targeted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Recipients</label>
                  <input type="number" value={cRecipients} onChange={e => setCRecipients(Number(e.target.value))} min={0} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Template</label>
                <select value={cTemplateId} onChange={e => setCTemplateId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Select template...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Schedule</label>
                <input type="datetime-local" value={cSchedule ? cSchedule.slice(0, 16) : ''} onChange={e => setCSchedule(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !cName.trim()} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: '#00B69B' }}>
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
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Campaign?</h3>
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
