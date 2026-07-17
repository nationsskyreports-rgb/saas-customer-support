import { supabase } from '@/lib/supabase'

/** Download rows as a UTF-8 CSV file (Excel-safe with BOM). */
export function downloadCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = '\uFEFF' + [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Fire-and-forget audit logger → activity_log table.
 * Never throws and never blocks the UI action that triggered it.
 */
export function logActivity(actor: string, action: string, entityType = '', metadata: Record<string, any> = {}) {
  supabase
    .from('activity_log')
    .insert({ actor, action, entity_type: entityType, metadata })
    .then(({ error }) => { if (error) console.warn('activity_log insert failed:', error.message) })
}
