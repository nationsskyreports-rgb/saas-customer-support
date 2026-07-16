'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, Upload, Download, RefreshCw, Trash2, Plus, X,
  Users, FileSpreadsheet, CheckCircle2, AlertTriangle, Plug, Link2, Save
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

const normalizePhone = (raw: string) => {
  let p = raw.trim().replace(/[\s\-().]/g, '')
  if (p.startsWith('+')) p = '+' + p.slice(1).replace(/\D/g, '')
  else p = p.replace(/\D/g, '')
  return p
}

const guessColumn = (headers: string[], candidates: string[]) => {
  const idx = headers.findIndex(h => candidates.some(c => h.toLowerCase().trim().includes(c)))
  return idx
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

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [cRes, tRes, crmRes] = await Promise.all([
      supabase.from('contacts').select('id, name, phone, email, customer_type, source, created_at').order('created_at', { ascending: false }).limit(1000),
      supabase.from('customer_types').select('id, name, color').order('name'),
      supabase.from('crm_settings').select('*').limit(1).maybeSingle(),
    ])
    if (cRes.data) setContacts(cRes.data as any)
    if (tRes.data) setTypes(tRes.data)
    if (crmRes.data) setCrm(crmRes.data as any)
    setLoading(false)
  }, [])

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

  const updateType = async (contactId: string, type: string) => {
    await supabase.from('contacts').update({ customer_type: type || null }).eq('id', contactId)
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, customer_type: type || null } : c))
  }

  const deleteContact = async () => {
    if (!deleteTarget) return
    await supabase.from('contacts').delete().eq('id', deleteTarget.id)
    setContacts(prev => prev.filter(c => c.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const addType = async () => {
    if (!newTypeName.trim()) return
    setAddingType(true)
    const { data } = await supabase.from('customer_types').insert({ name: newTypeName.trim() }).select().single()
    if (data) setTypes(prev => [...prev, data as any].sort((a, b) => a.name.localeCompare(b.name)))
    setNewTypeName('')
    setAddingType(false)
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
          <button onClick={() => setImportOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: '#00B69B' }}>
            <Upload className="w-4 h-4" /> Import Customers
          </button>
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

      {/* CRM Integration card */}
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
              <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400">No customers found — use <b>Import Customers</b> to upload your data</td></tr>
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
                  <select
                    value={c.customer_type || ''}
                    onChange={e => updateType(c.id, e.target.value)}
                    className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    style={{ color: c.customer_type ? typeColor(c.customer_type) : '#9CA3AF' }}
                  >
                    <option value="">No Type</option>
                    {types.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </td>
                <td className="px-6 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.source === 'crm' ? 'bg-blue-100 text-blue-700' : c.source === 'import' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.source || 'manual'}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-xs text-gray-500">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                <td className="px-6 py-3.5 text-right">
                  <button onClick={() => setDeleteTarget(c)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete customer">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
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
// Import Customers Modal
// ─────────────────────────────────────────────────────────────
function ImportCustomersModal({ types, onClose, onImported }: {
  types: CustomerType[]
  onClose: () => void
  onImported: () => void
}) {
  const [step, setStep] = useState<'upload' | 'map' | 'importing' | 'done'>('upload')
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [nameCol, setNameCol] = useState(-1)
  const [phoneCol, setPhoneCol] = useState(-1)
  const [emailCol, setEmailCol] = useState(-1)
  const [batchType, setBatchType] = useState('')
  const [progress, setProgress] = useState(0)
  const [summary, setSummary] = useState({ inserted: 0, updated: 0, skipped: 0 })
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

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
    const hdr = parsed[0].map(h => h.trim())
    setFileName(file.name)
    setHeaders(hdr)
    setRows(parsed.slice(1))
    // Auto-detect columns (English + Arabic headers)
    setNameCol(guessColumn(hdr, ['name', 'الاسم', 'اسم', 'client', 'customer']))
    setPhoneCol(guessColumn(hdr, ['phone', 'mobile', 'رقم', 'موبايل', 'تليفون', 'هاتف', 'tel']))
    setEmailCol(guessColumn(hdr, ['email', 'mail', 'ايميل', 'بريد']))
    setStep('map')
  }

  const startImport = async () => {
    if (phoneCol === -1) { setError('Phone column is required'); return }
    setStep('importing')
    setError('')

    // Build clean records, dedupe within file by phone
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
    const CHUNK = 200
    for (let i = 0; i < records.length; i += CHUNK) {
      const chunk = records.slice(i, i + CHUNK)
      const phones = chunk.map(c => c.phone)

      // find existing contacts by phone
      const { data: existing } = await supabase.from('contacts').select('id, phone').in('phone', phones)
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
        else skipped += toInsert.length
      }
      for (const c of toUpdate) {
        const upd: any = { name: c.name, source: 'import' }
        if (c.email) upd.email = c.email
        if (batchType) upd.customer_type = batchType
        const { error: updErr } = await supabase.from('contacts').update(upd).eq('id', existingMap.get(c.phone)!)
        if (!updErr) updated++
        else skipped++
      }
      setProgress(Math.round(((i + chunk.length) / records.length) * 100))
    }

    setSummary({ inserted, updated, skipped })
    setStep('done')
  }

  const previewRows = rows.slice(0, 6)

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
              <p className="text-xs text-gray-400">Upload a CSV file and assign a customer type</p>
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

          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-[#00B69B] hover:bg-emerald-50/40 transition-colors"
            >
              <Upload className="w-10 h-10 text-gray-300 mx-auto mb-4" />
              <p className="text-sm font-semibold text-gray-700">Click to upload or drag & drop</p>
              <p className="text-xs text-gray-400 mt-1">CSV files only — columns: Name, Phone (required), Email</p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>
          )}

          {/* STEP 2: Map columns + choose type */}
          {step === 'map' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2.5">
                <FileSpreadsheet className="w-4 h-4 text-[#00B69B]" />
                <b>{fileName}</b> · {rows.length} rows detected
              </div>

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
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setBatchType('')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${batchType === '' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                    No Type
                  </button>
                  {types.map(t => (
                    <button key={t.id} onClick={() => setBatchType(t.name)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                      style={batchType === t.name
                        ? { backgroundColor: t.color, color: '#FFF', borderColor: t.color }
                        : { backgroundColor: '#FFF', color: t.color, borderColor: t.color + '55' }}>
                      {t.name}
                    </button>
                  ))}
                </div>
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
                <button onClick={() => { setStep('upload'); setRows([]); setError('') }} className="text-sm text-gray-500 hover:underline">← Choose another file</button>
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
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 text-lg">Import Complete</h3>
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
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const save = async () => {
    setSaving(true)
    const payload = {
      provider: provider.trim(),
      api_url: apiUrl.trim(),
      api_key: apiKey.trim(),
      is_enabled: enabled,
      default_customer_type: defaultType || null,
      updated_at: new Date().toISOString(),
    }
    let saved: CrmSettings
    if (settings?.id) {
      const { data } = await supabase.from('crm_settings').update(payload).eq('id', settings.id).select().single()
      saved = data as any
    } else {
      const { data } = await supabase.from('crm_settings').insert(payload).select().single()
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
