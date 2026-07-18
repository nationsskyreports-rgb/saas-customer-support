'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, Upload, Download, RefreshCw, Trash2, Plus, X,
  Users, FileSpreadsheet, CheckCircle2, AlertTriangle, Plug, Link2, Save,
  ClipboardPaste
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePermissions } from '@/lib/permissions'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Contact {
  id: string
  name: string
  phone: string
  email: string | null
  customer_type: string | null
  source: string | null
  created_at: string | null
}
interface CustomerType { id: string; name: string; color: string }
interface CrmSettings {
  id?: string
  provider: string
  api_url: string
  api_key: string
  is_enabled: boolean
  auto_sync: boolean
  default_customer_type: string | null
  last_sync_at: string | null
  last_sync_status: string | null
}
interface Toast { id: number; type: 'success' | 'error'; message: string }

// ─────────────────────────────────────────────────────────────
// Small CSV parser (handles quotes, commas inside quotes, BOM, \r\n)
// ─────────────────────────────────────────────────────────────
function parseCSV(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cur += '"'; i++ } else { inQuotes = false }
      } else cur += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ',') { row.push(cur); cur = '' }
      else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
      else if (ch === '\r') { /* skip */ }
      else cur += ch
    }
  }
  if (cur.length > 0 || row.length > 0) { row.push(cur); rows.push(row) }
  return rows.filter(r => r.some(c => c.trim() !== ''))
}

// Parse pasted text: Excel copy/paste is tab-separated; also supports CSV or one value per line
function parsePasted(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = src.split('\n').filter(l => l.trim() !== '')
  if (lines.length === 0) return []
  const hasTabs = lines.some(l => l.includes('\t'))
  if (hasTabs) return lines.map(l => l.split('\t').map(c => c.trim()))
  const hasCommas = lines.some(l => l.includes(','))
  if (hasCommas) return parseCSV(src)
  // one column per line (e.g. list of phone numbers)
  return lines.map(l => [l.trim()])
}

const normalizePhone = (raw: string) => {
  let p = raw.trim().replace(/[\s\-().]/g, '')
  if (p.startsWith('+')) p = '+' + p.slice(1).replace(/\D/g, '')
  else p = p.replace(/\D/g, '')
  return p
}

const HEADER_KEYWORDS = ['name', 'phone', 'mobile', 'email', 'mail', 'tel', 'client', 'customer', 'الاسم', 'اسم', 'رقم', 'موبايل', 'تليفون', 'هاتف', 'ايميل', 'بريد']

const looksLikeHeader = (row: string[]) =>
  row.some(cell => HEADER_KEYWORDS.some(k => cell.toLowerCase().trim().includes(k)))

const guessColumn = (headers: string[], candidates: string[]) => {
  const idx = headers.findIndex(h => candidates.some(c => h.toLowerCase().trim().includes(c)))
  return idx
}

// If there's no header row, guess which column holds phones by data shape
const guessPhoneColByData = (rows: string[][]) => {
  const sample = rows.slice(0, 10)
  const colCount = Math.max(...sample.map(r => r.length))
  let best = -1, bestScore = 0
  for (let c = 0; c < colCount; c++) {
    const score = sample.filter(r => {
      const p = normalizePhone(r[c] || '')
      return p.length >= 7
    }).length
    if (score > bestScore) { bestScore = score; best = c }
  }
  return bestScore > 0 ? best : -1
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [types, setTypes] = useState<CustomerType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [importOpen, setImportOpen] = useState(false)
  const [crmOpen, setCrmOpen] = useState(false)
  const [crm, setCrm] = useState<CrmSettings | null>(null)
  const [newTypeName, setNewTypeName] = useState('')
  const [addingType, setAddingType] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)
  const [savingTypeIds, setSavingTypeIds] = useState<Set<string>>(new Set())
  const [toasts, setToasts] = useState<Toast[]>([])

  // ── Customer Type is a CLASSIFICATION, not a chat field ──
  // Agents see it read-only; only Super Admin (or a role explicitly granted
  // can_update on "Customers" in Terms & Roles) may change it.
  const { isSuperAdmin, can } = usePermissions()
  const canEditType = isSuperAdmin || can('Customers', 'can_update')
  // Agents: read-only customer base — no adding, no deleting, no CRM settings
  const canAddCustomers = isSuperAdmin || can('Customers', 'can_add')
  const canDeleteCustomers = isSuperAdmin || can('Customers', 'can_delete')
  const canManageCRM = isSuperAdmin || can('Customers', 'can_update')

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [cRes, tRes, crmRes] = await Promise.all([
      supabase.from('contacts').select('id, name, phone, email, customer_type, source, created_at').order('created_at', { ascending: false }).limit(1000),
      supabase.from('customer_types').select('id, name, color').order('name'),
      supabase.from('crm_settings').select('*').limit(1).maybeSingle(),
    ])
    if (cRes.error) showToast('error', `Failed to load customers: ${cRes.error.message}`)
    if (cRes.data) setContacts(cRes.data as any)
    if (tRes.data) setTypes(tRes.data)
    if (crmRes.data) setCrm(crmRes.data as any)
    setLoading(false)
  }, [showToast])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = contacts.filter(c => {
    if (typeFilter !== 'all') {
      if (typeFilter === 'none' && c.customer_type) return false
      if (typeFilter !== 'none' && c.customer_type !== typeFilter) return false
    }
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return c.name.toLowerCase().includes(s) || c.phone.includes(s) || (c.email || '').toLowerCase().includes(s)
  })

  const typeColor = (name: string | null) => types.find(t => t.name === name)?.color || '#9CA3AF'

  // ── FIX #1: verify the DB actually saved, revert + surface the error if not ──
  const updateType = async (contactId: string, type: string) => {
    if (!canEditType) {
      showToast('error', 'Customer Type is read-only for your role — contact an admin to change it')
      return
    }
    const previous = contacts.find(c => c.id === contactId)?.customer_type ?? null
    const nextValue = type || null

    // Optimistic UI + spinner on the row
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, customer_type: nextValue } : c))
    setSavingTypeIds(prev => new Set(prev).add(contactId))

    const { data, error } = await supabase
      .from('contacts')
      .update({ customer_type: nextValue })
      .eq('id', contactId)
      .select('id, customer_type')   // ← returns the updated row; empty array = nothing was saved (RLS / permissions)

    setSavingTypeIds(prev => { const n = new Set(prev); n.delete(contactId); return n })

    if (error || !data || data.length === 0) {
      // Revert the optimistic change — the database did NOT save it
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, customer_type: previous } : c))
      const reason = error?.message
        || 'The database rejected the change (0 rows updated). Run the "customers-fix.sql" script to add the missing permissions on the contacts table.'
      showToast('error', `Customer type was NOT saved: ${reason}`)
      return
    }
    showToast('success', nextValue ? `Saved — customer marked as "${nextValue}"` : 'Saved — type removed')
  }

  const deleteContact = async () => {
    if (!canDeleteCustomers) {
      showToast('error', 'Deleting customers is not allowed for your role')
      setDeleteTarget(null)
      return
    }
    if (!deleteTarget) return
    const target = deleteTarget
    const { data, error } = await supabase.from('contacts').delete().eq('id', target.id).select('id')
    if (error || !data || data.length === 0) {
      showToast('error', `Delete failed: ${error?.message || 'no rows deleted (check permissions)'}`)
      setDeleteTarget(null)
      return
    }
    setContacts(prev => prev.filter(c => c.id !== target.id))
    setDeleteTarget(null)
    showToast('success', `Deleted ${target.name}`)
  }

  const addType = async () => {
    if (!newTypeName.trim()) return
    setAddingType(true)
    const { data, error } = await supabase.from('customer_types').insert({ name: newTypeName.trim() }).select().single()
    setAddingType(false)
    if (error) {
      showToast('error', error.code === '23505' ? 'This type already exists' : `Could not add type: ${error.message}`)
      return
    }
    if (data) {
      setTypes(prev => [...prev, data as any].sort((a, b) => a.name.localeCompare(b.name)))
      setNewTypeName('')
      showToast('success', `Type "${(data as any).name}" added`)
    }
  }

  const exportCSV = () => {
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const header = ['Name', 'Phone', 'Email', 'Customer Type', 'Source', 'Created']
    const lines = filtered.map(c => [
      esc(c.name), esc(c.phone), esc(c.email), esc(c.customer_type), esc(c.source),
      esc(c.created_at ? new Date(c.created_at).toLocaleString() : ''),
    ].join(','))
    const csv = '\uFEFF' + [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // KPI counts
  const countByType = (name: string) => contacts.filter(c => c.customer_type === name).length

  return (
    <div className="p-8 space-y-6">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 w-96 max-w-[calc(100vw-2rem)]">
        {toasts.map(t => (
          <div key={t.id}
            className={`flex items-start gap-2.5 rounded-xl px-4 py-3 shadow-lg border text-sm animate-in ${
              t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
            {t.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
              : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="flex-shrink-0 opacity-50 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">Manage your customer base — import data, assign types, and connect your CRM</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          {canAddCustomers && (
            <button onClick={() => setImportOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: '#00B69B' }}>
              <Upload className="w-4 h-4" /> Import Customers
            </button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2"><Users className="w-4 h-4" /><span className="text-xs font-medium uppercase">Total</span></div>
          <p className="text-2xl font-bold text-gray-900">{loading ? '—' : contacts.length}</p>
        </div>
        {types.slice(0, 4).map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
              <span className="text-xs font-medium uppercase text-gray-400 truncate">{t.name}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '—' : countByType(t.name)}</p>
          </div>
        ))}
      </div>

      {/* CRM Integration card — admin-level configuration, hidden from agents */}
      {canManageCRM && (
      <div className="bg-white rounded-xl border p-5 flex items-center justify-between flex-wrap gap-4" style={{ borderColor: crm?.is_enabled ? '#00B69B' : '#E5E7EB' }}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${crm?.is_enabled ? 'bg-emerald-50' : 'bg-gray-100'}`}>
            <Plug className={`w-6 h-6 ${crm?.is_enabled ? 'text-[#00B69B]' : 'text-gray-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-sm">CRM Integration</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${crm?.is_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {crm?.is_enabled ? `Connected · ${crm.provider || 'CRM'}` : 'Not Connected'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {crm?.is_enabled
                ? `Last sync: ${crm.last_sync_at ? new Date(crm.last_sync_at).toLocaleString() : 'never'} ${crm.last_sync_status ? `· ${crm.last_sync_status}` : ''}`
                : 'Connect your CRM API to sync customers automatically into this platform'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {crm?.is_enabled && <CrmSyncButton onDone={fetchAll} />}
          <button onClick={() => setCrmOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Link2 className="w-4 h-4" /> {crm?.is_enabled ? 'Configure' : 'Connect CRM'}
          </button>
        </div>
      </div>
      )}

      {/* Search + filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex-1 relative min-w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
          <option value="all">All Types</option>
          {types.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
          <option value="none">No Type</option>
        </select>
        {canEditType && (
          <div className="flex items-center gap-2">
            <input
              type="text" value={newTypeName} onChange={e => setNewTypeName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addType()}
              placeholder="New type name..."
              className="w-36 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <button onClick={addType} disabled={addingType || !newTypeName.trim()}
              className="p-2 rounded-lg text-white disabled:opacity-40" style={{ backgroundColor: '#00B69B' }} title="Add customer type">
              {addingType ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="border-b border-gray-200" style={{ backgroundColor: '#EDFDF8' }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400"><RefreshCw className="w-5 h-5 animate-spin inline mr-2" /> Loading customers...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400">{canAddCustomers ? <>No customers found — use <b>Import Customers</b> to upload your data</> : 'No customers found'}</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="hover:bg-emerald-50/50 transition-colors">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0" style={{ backgroundColor: typeColor(c.customer_type) }}>
                      {(c.name || '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500" dir="ltr">{c.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-sm text-gray-600">{c.email || <span className="text-gray-300">—</span>}</td>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2">
                    {canEditType ? (
                      <>
                        <select
                          value={c.customer_type || ''}
                          onChange={e => updateType(c.id, e.target.value)}
                          disabled={savingTypeIds.has(c.id)}
                          className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50"
                          style={{ color: c.customer_type ? typeColor(c.customer_type) : '#9CA3AF' }}
                        >
                          <option value="">No Type</option>
                          {types.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                        </select>
                        {savingTypeIds.has(c.id) && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00B69B]" />}
                      </>
                    ) : (
                      /* Read-only badge — agents can SEE the type (VIP etc.) but never change it */
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        title="Read-only — only admins can change Customer Type"
                        style={{
                          color: c.customer_type ? typeColor(c.customer_type) : '#9CA3AF',
                          backgroundColor: (c.customer_type ? typeColor(c.customer_type) : '#9CA3AF') + '1A',
                        }}
                      >
                        {c.customer_type || 'No Type'} 🔒
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.source === 'crm' ? 'bg-blue-100 text-blue-700' : c.source === 'import' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.source || 'manual'}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-xs text-gray-500">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                <td className="px-6 py-3.5 text-right">
                  {canDeleteCustomers ? (
                    <button onClick={() => setDeleteTarget(c)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete customer">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  ) : (
                    <span className="text-xs text-gray-300 select-none" title="Read-only for your role">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {importOpen && (
        <ImportCustomersModal
          types={types}
          onClose={() => setImportOpen(false)}
          onImported={() => { setImportOpen(false); fetchAll() }}
        />
      )}
      {crmOpen && (
        <CrmSettingsModal
          settings={crm}
          types={types}
          onClose={() => setCrmOpen(false)}
          onSaved={(s) => { setCrm(s); setCrmOpen(false) }}
        />
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
              <h3 className="font-bold text-gray-900">Delete customer?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">This will permanently delete <b>{deleteTarget.name}</b> ({deleteTarget.phone}).</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={deleteContact} className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CRM Sync Now button (calls /api/crm/sync)
// ─────────────────────────────────────────────────────────────
function CrmSyncButton({ onDone }: { onDone: () => void }) {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const sync = async () => {
    setSyncing(true)
    setResult(null)
    try {
      const res = await fetch('/api/crm/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'sync' }) })
      const data = await res.json()
      setResult(data.message || (data.ok ? 'Synced ✓' : 'Sync failed'))
      if (data.ok) onDone()
    } catch {
      setResult('Sync failed — check API settings')
    }
    setSyncing(false)
    setTimeout(() => setResult(null), 6000)
  }

  return (
    <div className="flex items-center gap-2">
      {result && <span className="text-xs text-gray-500 max-w-52 truncate">{result}</span>}
      <button onClick={sync} disabled={syncing}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#00B69B' }}>
        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Customer Type chips (shared between import steps)
// ─────────────────────────────────────────────────────────────
function TypeChips({ types, value, onChange }: { types: CustomerType[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => onChange('')}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${value === '' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
        No Type
      </button>
      {types.map(t => (
        <button key={t.id} onClick={() => onChange(t.name)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
          style={value === t.name
            ? { backgroundColor: t.color, color: '#FFF', borderColor: t.color }
            : { backgroundColor: '#FFF', color: t.color, borderColor: t.color + '55' }}>
          {t.name}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Import Customers Modal
//  Step 1: pick customer type FIRST, then choose source (file upload OR copy/paste)
//  Step 2: map columns + preview
// ─────────────────────────────────────────────────────────────
function ImportCustomersModal({ types, onClose, onImported }: {
  types: CustomerType[]
  onClose: () => void
  onImported: () => void
}) {
  const [step, setStep] = useState<'source' | 'map' | 'importing' | 'done'>('source')
  const [method, setMethod] = useState<'file' | 'paste'>('file')
  const [pasteText, setPasteText] = useState('')
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [hasHeader, setHasHeader] = useState(true)
  const [rawParsed, setRawParsed] = useState<string[][]>([])
  const [nameCol, setNameCol] = useState(-1)
  const [phoneCol, setPhoneCol] = useState(-1)
  const [emailCol, setEmailCol] = useState(-1)
  const [batchType, setBatchType] = useState('')
  const [progress, setProgress] = useState(0)
  const [summary, setSummary] = useState({ inserted: 0, updated: 0, skipped: 0 })
  const [importError, setImportError] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Apply parsed data → set headers/rows depending on header presence, auto-detect columns
  const applyParsed = (parsed: string[][], headerPresent: boolean) => {
    setRawParsed(parsed)
    setHasHeader(headerPresent)
    if (headerPresent) {
      const hdr = parsed[0].map(h => h.trim())
      setHeaders(hdr)
      setRows(parsed.slice(1))
      setNameCol(guessColumn(hdr, ['name', 'الاسم', 'اسم', 'client', 'customer']))
      setPhoneCol(guessColumn(hdr, ['phone', 'mobile', 'رقم', 'موبايل', 'تليفون', 'هاتف', 'tel']))
      setEmailCol(guessColumn(hdr, ['email', 'mail', 'ايميل', 'بريد']))
    } else {
      const colCount = Math.max(...parsed.map(r => r.length))
      setHeaders(Array.from({ length: colCount }, (_, i) => `Column ${i + 1}`))
      setRows(parsed)
      const pc = guessPhoneColByData(parsed)
      setPhoneCol(pc)
      // name = first non-phone column, if any
      const nc = Array.from({ length: colCount }, (_, i) => i).find(i => i !== pc)
      setNameCol(nc !== undefined ? nc : -1)
      setEmailCol(-1)
    }
    setStep('map')
  }

  const toggleHeader = (headerPresent: boolean) => {
    if (rawParsed.length === 0) return
    applyParsed(rawParsed, headerPresent)
  }

  const handleFile = async (file: File) => {
    setError('')
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a .csv file (export your Excel sheet as CSV)')
      return
    }
    const text = await file.text()
    const parsed = parseCSV(text)
    if (parsed.length < 2) {
      setError('File must contain a header row plus at least one data row')
      return
    }
    setFileName(file.name)
    applyParsed(parsed, true)
  }

  const handlePaste = () => {
    setError('')
    const parsed = parsePasted(pasteText)
    if (parsed.length === 0) {
      setError('Paste at least one row of data (copy cells directly from Excel / Google Sheets)')
      return
    }
    setFileName('Pasted data')
    const headerPresent = looksLikeHeader(parsed[0]) && parsed.length > 1
    applyParsed(parsed, headerPresent)
  }

  const startImport = async () => {
    if (phoneCol === -1) { setError('Phone column is required'); return }
    setStep('importing')
    setError('')
    setImportError('')

    // Build clean records, dedupe within data by phone
    const seen = new Set<string>()
    const records: { name: string; phone: string; email: string | null }[] = []
    let skipped = 0
    for (const r of rows) {
      const phone = normalizePhone(r[phoneCol] || '')
      if (!phone || phone.length < 5) { skipped++; continue }
      if (seen.has(phone)) { skipped++; continue }
      seen.add(phone)
      records.push({
        name: (nameCol >= 0 ? (r[nameCol] || '').trim() : '') || phone,
        phone,
        email: emailCol >= 0 ? ((r[emailCol] || '').trim() || null) : null,
      })
    }

    let inserted = 0, updated = 0
    let firstError = ''
    const CHUNK = 200
    for (let i = 0; i < records.length; i += CHUNK) {
      const chunk = records.slice(i, i + CHUNK)
      const phones = chunk.map(c => c.phone)

      // find existing contacts by phone
      const { data: existing, error: exErr } = await supabase.from('contacts').select('id, phone').in('phone', phones)
      if (exErr && !firstError) firstError = exErr.message
      const existingMap = new Map((existing || []).map(e => [e.phone, e.id]))

      const toInsert = chunk.filter(c => !existingMap.has(c.phone))
      const toUpdate = chunk.filter(c => existingMap.has(c.phone))

      if (toInsert.length > 0) {
        const { error: insErr } = await supabase.from('contacts').insert(
          toInsert.map(c => ({
            name: c.name, phone: c.phone, email: c.email,
            customer_type: batchType || null, source: 'import',
          }))
        )
        if (!insErr) inserted += toInsert.length
        else { skipped += toInsert.length; if (!firstError) firstError = insErr.message }
      }
      for (const c of toUpdate) {
        const upd: any = { name: c.name, source: 'import' }
        if (c.email) upd.email = c.email
        if (batchType) upd.customer_type = batchType
        const { data: updData, error: updErr } = await supabase.from('contacts').update(upd).eq('id', existingMap.get(c.phone)!).select('id')
        if (!updErr && updData && updData.length > 0) updated++
        else { skipped++; if (!firstError && updErr) firstError = updErr.message }
      }
      setProgress(Math.round(((i + chunk.length) / records.length) * 100))
    }

    setSummary({ inserted, updated, skipped })
    if (firstError) setImportError(firstError)
    setStep('done')
  }

  const previewRows = rows.slice(0, 6)
  const selectedType = types.find(t => t.name === batchType)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-[#00B69B]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Import Customers</h3>
              <p className="text-xs text-gray-400">Choose a customer type, then upload a CSV or paste your data</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* STEP 1: Choose type first + source (upload or paste) */}
          {step === 'source' && (
            <div className="space-y-5">
              {/* 1) Customer type — chosen BEFORE uploading */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">
                  1 · Customer Type <span className="normal-case font-normal text-gray-400">(applied to all imported customers)</span>
                </label>
                <TypeChips types={types} value={batchType} onChange={setBatchType} />
              </div>

              {/* 2) Source tabs */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">2 · Data Source</label>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => { setMethod('file'); setError('') }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${method === 'file' ? 'border-[#00B69B] text-[#00B69B] bg-emerald-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <Upload className="w-4 h-4" /> Upload CSV File
                  </button>
                  <button onClick={() => { setMethod('paste'); setError('') }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${method === 'paste' ? 'border-[#00B69B] text-[#00B69B] bg-emerald-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <ClipboardPaste className="w-4 h-4" /> Copy / Paste
                  </button>
                </div>

                {method === 'file' ? (
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-[#00B69B] hover:bg-emerald-50/40 transition-colors"
                  >
                    <Upload className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm font-semibold text-gray-700">Click to upload or drag &amp; drop</p>
                    <p className="text-xs text-gray-400 mt-1">CSV files only — columns: Name, Phone (required), Email</p>
                    <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={pasteText}
                      onChange={e => setPasteText(e.target.value)}
                      placeholder={'Paste rows copied from Excel / Google Sheets, e.g.:\nAhmed Ali\t+201001234567\tahmed@mail.com\nSara Hassan\t+201009876543\n\nOr simply one phone number per line.'}
                      rows={8}
                      dir="ltr"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-y"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">Supports Excel copy/paste (tab-separated), CSV text, or a plain list of phone numbers</p>
                      <button onClick={handlePaste} disabled={!pasteText.trim()}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40" style={{ backgroundColor: '#00B69B' }}>
                        Continue <span aria-hidden>→</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Map columns + preview */}
          {step === 'map' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3 flex-wrap bg-gray-50 rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileSpreadsheet className="w-4 h-4 text-[#00B69B]" />
                  <b>{fileName}</b> · {rows.length} rows detected
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-gray-400">Type:</span>
                  {selectedType ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: selectedType.color }}>{selectedType.name}</span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-200 text-gray-500">No Type</span>
                  )}
                </div>
              </div>

              {/* Header toggle (mainly useful for pasted data) */}
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                <input type="checkbox" checked={hasHeader} onChange={e => toggleHeader(e.target.checked)} className="w-4 h-4 accent-[#00B69B]" />
                First row is a header row
              </label>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Name Column', val: nameCol, set: setNameCol, required: false },
                  { label: 'Phone Column *', val: phoneCol, set: setPhoneCol, required: true },
                  { label: 'Email Column', val: emailCol, set: setEmailCol, required: false },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">{f.label}</label>
                    <select value={f.val} onChange={e => f.set(Number(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 ${f.required && f.val === -1 ? 'border-red-300' : 'border-gray-200'}`}>
                      <option value={-1}>— Not in file —</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Customer Type (applied to all imported customers)</label>
                <TypeChips types={types} value={batchType} onChange={setBatchType} />
              </div>

              {/* Preview */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Preview (first {previewRows.length} rows)</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">Phone</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewRows.map((r, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-gray-700">{nameCol >= 0 ? r[nameCol] : <span className="text-gray-300">—</span>}</td>
                          <td className="px-3 py-2 text-gray-700" dir="ltr">{phoneCol >= 0 ? normalizePhone(r[phoneCol] || '') : <span className="text-red-400">select column</span>}</td>
                          <td className="px-3 py-2 text-gray-700">{emailCol >= 0 ? r[emailCol] : <span className="text-gray-300">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button onClick={() => { setStep('source'); setRows([]); setRawParsed([]); setError('') }} className="text-sm text-gray-500 hover:underline">← Back</button>
                <button onClick={startImport} disabled={phoneCol === -1}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40" style={{ backgroundColor: '#00B69B' }}>
                  <Upload className="w-4 h-4" /> Import {rows.length} Customers
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Importing */}
          {step === 'importing' && (
            <div className="py-10 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-[#00B69B] mx-auto mb-4" />
              <p className="text-sm font-semibold text-gray-700">Importing customers... {progress}%</p>
              <div className="w-64 h-2 bg-gray-100 rounded-full mx-auto mt-4 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: '#00B69B' }} />
              </div>
            </div>
          )}

          {/* STEP 4: Done */}
          {step === 'done' && (
            <div className="py-8 text-center">
              {importError && summary.inserted === 0 && summary.updated === 0 ? (
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              ) : (
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              )}
              <h3 className="font-bold text-gray-900 text-lg">
                {importError && summary.inserted === 0 && summary.updated === 0 ? 'Import Failed' : 'Import Complete'}
              </h3>
              {importError && (
                <p className="text-xs text-red-500 mt-2 max-w-md mx-auto">
                  {summary.skipped > 0 ? `${summary.skipped} rows failed: ` : ''}{importError}
                </p>
              )}
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div><p className="text-2xl font-bold text-green-600">{summary.inserted}</p><p className="text-gray-400 text-xs">New</p></div>
                <div><p className="text-2xl font-bold text-blue-600">{summary.updated}</p><p className="text-gray-400 text-xs">Updated</p></div>
                <div><p className="text-2xl font-bold text-gray-400">{summary.skipped}</p><p className="text-gray-400 text-xs">Skipped</p></div>
              </div>
              <button onClick={onImported} className="mt-6 px-6 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#00B69B' }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CRM Settings Modal
// ─────────────────────────────────────────────────────────────
function CrmSettingsModal({ settings, types, onClose, onSaved }: {
  settings: CrmSettings | null
  types: CustomerType[]
  onClose: () => void
  onSaved: (s: CrmSettings) => void
}) {
  const [provider, setProvider] = useState(settings?.provider || '')
  const [apiUrl, setApiUrl] = useState(settings?.api_url || '')
  const [apiKey, setApiKey] = useState(settings?.api_key || '')
  const [enabled, setEnabled] = useState(settings?.is_enabled || false)
  const [defaultType, setDefaultType] = useState(settings?.default_customer_type || '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const save = async () => {
    setSaving(true)
    setSaveError('')
    const payload = {
      provider: provider.trim(),
      api_url: apiUrl.trim(),
      api_key: apiKey.trim(),
      is_enabled: enabled,
      default_customer_type: defaultType || null,
      updated_at: new Date().toISOString(),
    }
    let saved: CrmSettings | null = null
    if (settings?.id) {
      const { data, error } = await supabase.from('crm_settings').update(payload).eq('id', settings.id).select().single()
      if (error) setSaveError(error.message)
      saved = data as any
    } else {
      const { data, error } = await supabase.from('crm_settings').insert(payload).select().single()
      if (error) setSaveError(error.message)
      saved = data as any
    }
    setSaving(false)
    if (saved) onSaved(saved)
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/crm/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'test', api_url: apiUrl.trim(), api_key: apiKey.trim() }),
      })
      const data = await res.json()
      setTestResult({ ok: !!data.ok, message: data.message || (data.ok ? 'Connection OK' : 'Connection failed') })
    } catch {
      setTestResult({ ok: false, message: 'Could not reach the API' })
    }
    setTesting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Plug className="w-5 h-5 text-[#00B69B]" /></div>
            <div>
              <h3 className="font-bold text-gray-900">CRM Integration</h3>
              <p className="text-xs text-gray-400">Connect an external CRM to sync customers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Provider Name</label>
            <input type="text" value={provider} onChange={e => setProvider(e.target.value)} placeholder="e.g. NOS CRM"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">API URL</label>
            <input type="url" value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="https://crm.example.com/api/customers" dir="ltr"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            <p className="text-xs text-gray-400 mt-1">Endpoint should return a JSON array of customers: <code className="bg-gray-100 px-1 rounded">[{'{'}"name", "phone", "email"{'}'}]</code></p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">API Key</label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Sent as Authorization: Bearer <key>" dir="ltr"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Default Customer Type for synced customers</label>
            <select value={defaultType} onChange={e => setDefaultType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="">No Type</option>
              {types.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer pt-1">
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="w-4 h-4 accent-[#00B69B]" />
            <span className="text-sm text-gray-700 font-medium">Enable CRM integration</span>
          </label>

          {saveError && (
            <div className="flex items-center gap-2 text-sm rounded-lg px-4 py-3 border bg-red-50 border-red-200 text-red-600">
              <AlertTriangle className="w-4 h-4" /> Save failed: {saveError}
            </div>
          )}
          {testResult && (
            <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 border ${testResult.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
              {testResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {testResult.message}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <button onClick={testConnection} disabled={testing || !apiUrl.trim()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
            {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />} Test Connection
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#00B69B' }}>
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
