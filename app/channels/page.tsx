'use client'

import { useState, useEffect } from 'react'
import { Settings, RefreshCw, MessageCircle, X, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToasts, Toasts } from '@/components/ui/toasts'

interface Channel {
  id: string
  name: string
  type: string
  phone: string
  availability: boolean
  welcome_message: string
  away_message: string
  assign_mode: string
  max_chats_per_agent: number
  created_at: string
}

export default function ChannelsPage() {
  const { toasts, showToast, dismissToast } = useToasts()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [selected, setSelected] = useState<Channel | null>(null)
  const [editName, setEditName] = useState('')
  const [editWelcome, setEditWelcome] = useState('')
  const [editAway, setEditAway] = useState('')
  const [editAssign, setEditAssign] = useState('auto')
  const [editMaxChats, setEditMaxChats] = useState(5)
  const [saving, setSaving] = useState(false)

  const fetchChannels = async () => {
    setLoading(true)
    const { data } = await supabase.from('channels').select('*').order('created_at')
    if (data) setChannels(data)
    setLoading(false)
  }

  useEffect(() => { fetchChannels() }, [])

  const toggleAvailability = async (ch: Channel) => {
    const { data, error } = await supabase.from('channels').update({ availability: !ch.availability }).eq('id', ch.id).select('id')
    if (error || !data || data.length === 0) {
      showToast('error', `Could not change availability: ${error?.message || 'no rows updated (check permissions)'}`)
      return
    }
    showToast('success', `Channel ${!ch.availability ? 'enabled' : 'disabled'}`)
    fetchChannels()
  }

  const openSettings = (ch: Channel) => {
    setSelected(ch)
    setEditName(ch.name)
    setEditWelcome(ch.welcome_message)
    setEditAway(ch.away_message)
    setEditAssign(ch.assign_mode)
    setEditMaxChats(ch.max_chats_per_agent)
    setShowSettings(true)
  }

  const saveSettings = async () => {
    if (!selected) return
    setSaving(true)
    const { data, error } = await supabase.from('channels').update({
      name: editName,
      welcome_message: editWelcome,
      away_message: editAway,
      assign_mode: editAssign,
      max_chats_per_agent: editMaxChats,
    }).eq('id', selected.id).select('id')
    setSaving(false)
    if (error || !data || data.length === 0) {
      showToast('error', `Save failed: ${error?.message || 'no rows updated (check permissions)'}`)
      return
    }
    setShowSettings(false)
    showToast('success', 'Channel settings saved')
    fetchChannels()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /><span className="ml-3 text-gray-500">Loading channels...</span></div>
  }

  return (
    <div className="p-8">
      <Toasts toasts={toasts} dismiss={dismissToast} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meta Channels</h1>
        <p className="text-gray-500 mt-1">Manage your WhatsApp Business channels</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="px-6 py-3 text-left text-sm font-semibold">Channel Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Identifier</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Assignment</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Availability</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {channels.map(ch => (
              <tr key={ch.id} className="hover:bg-emerald-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-900">{ch.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full capitalize">{ch.type}</span>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-gray-900">{ch.phone}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${ch.assign_mode === 'auto' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{ch.assign_mode}</span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleAvailability(ch)} className="flex items-center gap-1.5">
                    {ch.availability ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-teal-500 text-white text-xs font-bold rounded-full">Yes<span className="w-3 h-3 bg-white rounded-full opacity-80" /></span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-300 text-gray-700 text-xs font-bold rounded-full">No<span className="w-3 h-3 bg-white rounded-full opacity-80" /></span>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(ch.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <button onClick={() => openSettings(ch)} className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors">
                    <Settings className="w-3.5 h-3.5" />
                    Settings
                  </button>
                </td>
              </tr>
            ))}
            {channels.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No channels found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Settings Drawer */}
      {showSettings && selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setShowSettings(false)}>
          <div className="w-96 h-full bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Channel Settings</h2>
                <p className="text-xs text-gray-500">{selected.name}</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Channel Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <input type="text" value={selected.phone} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
              <hr className="border-gray-200" />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Welcome Message</label>
                <textarea value={editWelcome} onChange={e => setEditWelcome(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Away Message</label>
                <textarea value={editAway} onChange={e => setEditAway(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Assignment Mode</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={editAssign === 'auto'} onChange={() => setEditAssign('auto')} className="accent-emerald-500" />
                    <span className="text-sm text-gray-700">Auto-assign</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={editAssign === 'manual'} onChange={() => setEditAssign('manual')} className="accent-emerald-500" />
                    <span className="text-sm text-gray-700">Manual</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Chats per Agent</label>
                <input type="number" value={editMaxChats} onChange={e => setEditMaxChats(Number(e.target.value))} min={1} max={20} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowSettings(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={saveSettings} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ backgroundColor: '#00B69B' }}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
