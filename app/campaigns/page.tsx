'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus, Edit2, Trash2, Send, RefreshCw, X, Save, Megaphone,
  Users, AlertTriangle, CheckCircle2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getAgent } from '@/lib/auth'
import { logActivity } from '@/lib/report-utils'
import { useToasts, Toasts } from '@/components/ui/toasts'

interface Campaign {
  id: string; name: string; status: string; type: string
  recipient_count: number; sent_count: number; failed_count: number | null
  template_id: string | null
  audience: string | null            // 'all' | 'type'
  customer_type: string | null       // when audience = 'type'
  message: string | null             // message snapshot actually sent
  scheduled_at: string | null
  sent_at: string | null
  created_at: string
}
interface Template { id: string; name: string; content: string }
interface CustomerType { id: string; name: string; color: string }

export default function CampaignsPage() {
  const { toasts, showToast, dismissToast } = useToasts()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [types, setTypes] = useState<CustomerType[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Campaign | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Campaign | null>(null)
  const [sendTarget, setSendTarget] = useState<Campaign | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [campRes, tmplRes, typeRes] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('templates').select('id, name, content').order('name'),
      supabase.from('customer_types').select('id, name, color').order('name'),
    ])
    if (campRes.error) showToast('error', `Failed to load campaigns: ${campRes.error.message}`)
    if (campRes.data) setCampaigns(campRes.data as any)
    if (tmplRes.data) setTemplates(tmplRes.data as any)
    if (typeRes.data) setTypes(typeRes.data)
    setLoading(false)
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'draft': return 'bg-gray-100 text-gray-700'
      case 'scheduled': return 'bg-blue-100 text-blue-700'
      case 'active': return 'bg-amber-100 text-amber-700'
      case 'completed': return 'bg-emerald-100 text-emerald-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const typeColor = (name: string | null) => types.find(t => t.name === name)?.color || '#9CA3AF'

  const handleDelete = async () => {
    if (!confirmDelete) return
    const target = confirmDelete
    const { data, error } = await supabase.from('campaigns').delete().eq('id', target.id).select('id')
    setConfirmDelete(null)
    if (error || !data || data.length === 0) {
      showToast('error', `Delete failed: ${error?.message || 'no rows deleted (check permissions)'}`)
      return
    }
    setCampaigns(prev => prev.filter(c => c.id !== target.id))
    showToast('success', `Campaign "${target.name}" deleted`)
  }

  const audienceLabel = (c: Campaign) =>
    c.audience === 'type' && c.customer_type ? c.customer_type : 'All Customers'

  return (
    <div className="p-8">
      <Toasts toasts={toasts} dismiss={dismissToast} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-500 mt-1">Broadcast messages to customer segments — audiences are linked to your Customer Types</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-colors" style={{ backgroundColor: '#00B69B' }}>
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Campaign</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Audience</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Recipients</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-400"><RefreshCw className="w-5 h-5 animate-spin inline mr-2" /> Loading campaigns...</td></tr>
            ) : campaigns.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                <Megaphone className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                No campaigns yet — create one to broadcast a message to your customers
              </td></tr>
            ) : campaigns.map(c => {
              const pct = c.recipient_count > 0 ? Math.round((c.sent_count / c.recipient_count) * 100) : 0
              return (
                <tr key={c.id} className="hover:bg-emerald-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                    {c.message && <p className="text-xs text-gray-400 truncate max-w-56 mt-0.5">{c.message}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={c.audience === 'type' && c.customer_type
                        ? { backgroundColor: typeColor(c.customer_type) + '22', color: typeColor(c.customer_type) }
                        : { backgroundColor: '#F3F4F6', color: '#4B5563' }}>
                      <Users className="w-3 h-3" /> {audienceLabel(c)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(c.status)}`}>
                      {c.status === 'active' ? 'Sending' : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">{c.recipient_count.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 min-w-32">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#00B69B' }} />
                      </div>
                      <span className="text-xs text-gray-500 w-16">{c.sent_count.toLocaleString()} ({pct}%)</span>
                    </div>
                    {(c.failed_count || 0) > 0 && <p className="text-xs text-red-500 mt-0.5">{c.failed_count} failed</p>}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {(c.status === 'draft' || c.status === 'scheduled') && (
                        <button onClick={() => setSendTarget(c)} title="Send now"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90" style={{ backgroundColor: '#00B69B' }}>
                          <Send className="w-3.5 h-3.5" /> Send
                        </button>
                      )}
                      {c.status !== 'active' && (
                        <button onClick={() => { setEditItem(c); setShowModal(true) }} className="p-2 hover:bg-gray-100 rounded-lg" title="Edit">
                          <Edit2 className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                      {c.status !== 'active' && (
                        <button onClick={() => setConfirmDelete(c)} className="p-2 hover:bg-red-50 rounded-lg" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CampaignModal
          item={editItem}
          templates={templates}
          types={types}
          onClose={() => setShowModal(false)}
          onSaved={(msg) => { setShowModal(false); showToast('success', msg); fetchData() }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {sendTarget && (
        <SendCampaignModal
          campaign={sendTarget}
          onClose={() => setSendTarget(null)}
          onDone={(ok, msg) => { setSendTarget(null); showToast(ok ? 'success' : 'error', msg); fetchData() }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
              <h3 className="font-bold text-gray-900">Delete campaign?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">This will permanently delete <b>{confirmDelete.name}</b>. Messages already sent will not be removed.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Create / Edit Campaign
// ─────────────────────────────────────────────────────────────
function CampaignModal({ item, templates, types, onClose, onSaved, onError }: {
  item: Campaign | null
  templates: Template[]
  types: CustomerType[]
  onClose: () => void
  onSaved: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [name, setName] = useState(item?.name || '')
  const [audience, setAudience] = useState<'all' | 'type'>((item?.audience as any) || 'all')
  const [customerType, setCustomerType] = useState(item?.customer_type || '')
  const [templateId, setTemplateId] = useState(item?.template_id || '')
  const [message, setMessage] = useState(item?.message || '')
  const [schedule, setSchedule] = useState(item?.scheduled_at ? item.scheduled_at.slice(0, 16) : '')
  const [recipientCount, setRecipientCount] = useState<number | null>(item?.recipient_count ?? null)
  const [counting, setCounting] = useState(false)
  const [saving, setSaving] = useState(false)

  // Live audience count from the contacts table
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setCounting(true)
      let q = supabase.from('contacts').select('id', { count: 'exact', head: true })
      if (audience === 'type') {
        if (!customerType) { setRecipientCount(0); setCounting(false); return }
        q = q.eq('customer_type', customerType)
      }
      const { count, error } = await q
      if (cancelled) return
      setRecipientCount(error ? null : (count || 0))
      setCounting(false)
    }
    run()
    return () => { cancelled = true }
  }, [audience, customerType])

  // Selecting a template pre-fills the message (still editable)
  const applyTemplate = (id: string) => {
    setTemplateId(id)
    const t = templates.find(x => x.id === id)
    if (t) setMessage(t.content)
  }

  const save = async () => {
    if (!name.trim()) { onError('Campaign name is required'); return }
    if (audience === 'type' && !customerType) { onError('Choose a customer type for the audience'); return }
    if (!message.trim()) { onError('Message content is required — pick a template or write a message'); return }
    setSaving(true)
    const payload: any = {
      name: name.trim(),
      type: audience === 'type' ? 'targeted' : 'broadcast',
      audience,
      customer_type: audience === 'type' ? customerType : null,
      template_id: templateId || null,
      message: message.trim(),
      recipient_count: recipientCount ?? 0,
      scheduled_at: schedule ? new Date(schedule).toISOString() : null,
    }
    if (item) {
      const { data, error } = await supabase.from('campaigns').update(payload).eq('id', item.id).select('id')
      setSaving(false)
      if (error || !data || data.length === 0) {
        onError(`Save failed: ${error?.message || 'no rows updated — run the project-upgrade.sql script'}`)
        return
      }
      onSaved('Campaign updated')
    } else {
      payload.status = schedule ? 'scheduled' : 'draft'
      payload.sent_count = 0
      const { error } = await supabase.from('campaigns').insert(payload)
      setSaving(false)
      if (error) {
        onError(`Create failed: ${error.message}${error.message.includes('column') ? ' — run the project-upgrade.sql script' : ''}`)
        return
      }
      onSaved('Campaign created')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Megaphone className="w-5 h-5 text-[#00B69B]" /></div>
            <h3 className="font-bold text-gray-900">{item ? 'Edit Campaign' : 'New Campaign'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Campaign Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Eid Sale Announcement"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>

          {/* Audience */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Audience</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setAudience('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${audience === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                All Customers
              </button>
              {types.map(t => (
                <button key={t.id} onClick={() => { setAudience('type'); setCustomerType(t.name) }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={audience === 'type' && customerType === t.name
                    ? { backgroundColor: t.color, color: '#FFF', borderColor: t.color }
                    : { backgroundColor: '#FFF', color: t.color, borderColor: t.color + '55' }}>
                  {t.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <Users className="w-4 h-4 text-[#00B69B]" />
              {counting
                ? <span className="text-gray-400 text-xs">Counting recipients…</span>
                : recipientCount === null
                  ? <span className="text-red-500 text-xs">Could not count recipients — check the contacts table</span>
                  : <span className="text-gray-700 font-semibold text-xs">{recipientCount.toLocaleString()} recipients will receive this campaign</span>}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Template (optional — fills the message below)</label>
            <select value={templateId} onChange={e => applyTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="">— Write a custom message —</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Message Content *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
              placeholder="The message every recipient will receive..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-y" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Schedule (optional)</label>
            <input type="datetime-local" value={schedule} onChange={e => setSchedule(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            <p className="text-xs text-gray-400 mt-1">Leave empty to keep as draft and send manually with the Send button</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#00B69B' }}>
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {item ? 'Save Changes' : 'Create Campaign'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Send engine — writes real messages into real conversations
// ─────────────────────────────────────────────────────────────
function SendCampaignModal({ campaign, onClose, onDone }: {
  campaign: Campaign
  onClose: () => void
  onDone: (ok: boolean, msg: string) => void
}) {
  const [phase, setPhase] = useState<'confirm' | 'sending' | 'done'>('confirm')
  const [progress, setProgress] = useState(0)
  const [sent, setSent] = useState(0)
  const [failed, setFailed] = useState(0)
  const [totalRecipients, setTotalRecipients] = useState(campaign.recipient_count)
  const [fatalError, setFatalError] = useState('')
  const cancelRef = useRef(false)

  const me = getAgent()

  const startSend = async () => {
    setPhase('sending')
    cancelRef.current = false
    const nowIso = () => new Date().toISOString()
    const content = (campaign.message || '').trim()
    if (!content) {
      setFatalError('This campaign has no message content — edit it and add a message first')
      setPhase('done')
      return
    }

    // 1) Load recipients
    let q = supabase.from('contacts').select('id, name, phone')
    if (campaign.audience === 'type' && campaign.customer_type) q = q.eq('customer_type', campaign.customer_type)
    const { data: contacts, error: cErr } = await q.limit(10000)
    if (cErr) { setFatalError(`Could not load recipients: ${cErr.message}`); setPhase('done'); return }
    const recipients = contacts || []
    setTotalRecipients(recipients.length)
    if (recipients.length === 0) { setFatalError('No recipients match this audience'); setPhase('done'); return }

    // 2) Default channel (conversations require one)
    const { data: channel, error: chErr } = await supabase.from('channels').select('id').limit(1).maybeSingle()
    if (chErr || !channel) { setFatalError('No channel found — create one in the Channels page first'); setPhase('done'); return }

    // 3) Mark campaign as sending
    const { error: statusErr } = await supabase.from('campaigns')
      .update({ status: 'active', recipient_count: recipients.length, sent_count: 0, failed_count: 0 })
      .eq('id', campaign.id)
    if (statusErr) { setFatalError(`Could not start campaign: ${statusErr.message}`); setPhase('done'); return }

    // 4) Existing conversations per contact (latest per contact wins)
    const convByContact = new Map<string, string>()
    const CHUNK = 100
    for (let i = 0; i < recipients.length; i += CHUNK) {
      const ids = recipients.slice(i, i + CHUNK).map(r => r.id)
      const { data: convs } = await supabase
        .from('conversations')
        .select('id, contact_id, updated_at')
        .in('contact_id', ids)
        .order('updated_at', { ascending: false })
      convs?.forEach((c: any) => { if (!convByContact.has(c.contact_id)) convByContact.set(c.contact_id, c.id) })
    }

    // 5) Send loop
    let sentCount = 0, failedCount = 0
    for (let i = 0; i < recipients.length; i++) {
      if (cancelRef.current) break
      const r = recipients[i]
      try {
        let convId = convByContact.get(r.id)

        if (!convId) {
          // New conversation created as 'closed' so broadcasts don't flood the live inbox.
          // If the customer replies, the existing inbound flow reopens it automatically.
          const { data: conv, error: convErr } = await supabase
            .from('conversations')
            .insert({ contact_id: r.id, channel_id: channel.id, status: 'closed' })
            .select('id')
            .single()
          if (convErr || !conv) { failedCount++; continue }
          convId = conv.id
          convByContact.set(r.id, conv.id)
        }

        const { error: msgErr } = await supabase.from('messages').insert({
          conversation_id: convId,
          direction: 'outbound',
          type: 'text',
          content,
          sender: 'agent',
          sender_agent_id: me?.id || null,
        })
        if (msgErr) { failedCount++; continue }

        await supabase.from('conversations').update({
          updated_at: nowIso(),
          last_message_preview: content.slice(0, 120),
          last_message_at: nowIso(),
        }).eq('id', convId)

        sentCount++
      } catch {
        failedCount++
      }

      // Periodic progress persistence + UI update
      if ((i + 1) % 10 === 0 || i === recipients.length - 1) {
        setSent(sentCount); setFailed(failedCount)
        setProgress(Math.round(((i + 1) / recipients.length) * 100))
        supabase.from('campaigns').update({ sent_count: sentCount, failed_count: failedCount }).eq('id', campaign.id).then(() => {})
      }
    }

    // 6) Finalize
    await supabase.from('campaigns').update({
      status: 'completed',
      sent_count: sentCount,
      failed_count: failedCount,
      sent_at: nowIso(),
    }).eq('id', campaign.id)

    logActivity(me?.name || 'Admin', `sent campaign "${campaign.name}"`, 'campaign',
      { sent: sentCount, failed: failedCount, audience: campaign.audience === 'type' ? campaign.customer_type : 'all' })

    setSent(sentCount); setFailed(failedCount); setProgress(100)
    setPhase('done')
  }

  const finish = () => {
    if (phase === 'sending') { cancelRef.current = true; return }
    if (fatalError) onDone(false, fatalError)
    else onDone(true, `Campaign sent — ${sent.toLocaleString()} delivered${failed > 0 ? `, ${failed} failed` : ''}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => phase === 'confirm' && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>

        {phase === 'confirm' && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Send className="w-5 h-5 text-[#00B69B]" /></div>
              <h3 className="font-bold text-gray-900">Send "{campaign.name}"?</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
              <p><span className="text-gray-400">Audience:</span> <b className="text-gray-800">{campaign.audience === 'type' && campaign.customer_type ? campaign.customer_type : 'All Customers'}</b> · ~{campaign.recipient_count.toLocaleString()} recipients</p>
              <p className="text-gray-600 border-l-2 border-[#00B69B] pl-3 whitespace-pre-wrap">{campaign.message || <i className="text-red-400">No message content!</i>}</p>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              A message will be written to each recipient's conversation (a closed conversation is created for customers who never chatted before, so your live inbox isn't flooded).
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={startSend} disabled={!campaign.message}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40" style={{ backgroundColor: '#00B69B' }}>
                <Send className="w-4 h-4" /> Send Now
              </button>
            </div>
          </>
        )}

        {phase === 'sending' && (
          <div className="py-6 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#00B69B] mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700">Sending... {progress}%</p>
            <p className="text-xs text-gray-400 mt-1">{sent.toLocaleString()} sent{failed > 0 ? ` · ${failed} failed` : ''} of {totalRecipients.toLocaleString()}</p>
            <div className="w-64 h-2 bg-gray-100 rounded-full mx-auto mt-4 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: '#00B69B' }} />
            </div>
            <button onClick={finish} className="mt-5 text-xs text-gray-400 hover:text-red-500 underline">Stop sending</button>
          </div>
        )}

        {phase === 'done' && (
          <div className="py-4 text-center">
            {fatalError ? (
              <>
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 text-lg">Send Failed</h3>
                <p className="text-sm text-red-500 mt-2">{fatalError}</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 text-lg">Campaign Sent</h3>
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <div><p className="text-2xl font-bold text-green-600">{sent.toLocaleString()}</p><p className="text-gray-400 text-xs">Sent</p></div>
                  <div><p className="text-2xl font-bold text-red-500">{failed}</p><p className="text-gray-400 text-xs">Failed</p></div>
                </div>
              </>
            )}
            <button onClick={finish} className="mt-6 px-6 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#00B69B' }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
