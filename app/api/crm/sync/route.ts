import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * ─── CRM Sync API ─────────────────────────────────────────────
 * POST /api/crm/sync
 *
 * body: { mode: 'test' | 'sync', api_url?, api_key? }
 *
 * - mode 'test' → checks that the CRM API is reachable
 *   (uses api_url/api_key from body if provided, otherwise from crm_settings)
 * - mode 'sync' → pulls customers from the configured CRM endpoint
 *   and upserts them into `contacts` (deduped by phone).
 *
 * Expected CRM response (generic format — adjust mapping below
 * when connecting the real NOS CRM):
 *   [ { "name": "...", "phone": "...", "email": "..." }, ... ]
 * ──────────────────────────────────────────────────────────────
 */

// Lazily create the client so the build doesn't fail when env vars
// aren't available at build time (they're injected at runtime on Vercel).
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

const normalizePhone = (raw: string) => {
  let p = String(raw || '').trim().replace(/[\s\-().]/g, '')
  if (p.startsWith('+')) p = '+' + p.slice(1).replace(/\D/g, '')
  else p = p.replace(/\D/g, '')
  return p
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ ok: false, message: 'Server is missing Supabase environment variables.' })
  }

  let body: any = {}
  try { body = await req.json() } catch { /* empty body */ }
  const mode = body.mode === 'sync' ? 'sync' : 'test'

  // Load settings (body overrides allow testing before saving)
  const { data: settings } = await supabase.from('crm_settings').select('*').limit(1).maybeSingle()
  const apiUrl: string = (body.api_url || settings?.api_url || '').trim()
  const apiKey: string = (body.api_key || settings?.api_key || '').trim()

  if (!apiUrl) {
    return NextResponse.json({
      ok: false,
      message: 'CRM API is not configured yet. Add your API URL in the CRM settings.',
    })
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

  // ── TEST MODE ──
  if (mode === 'test') {
    try {
      const res = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(10000) })
      return NextResponse.json({
        ok: res.ok,
        message: res.ok
          ? `Connection OK (HTTP ${res.status})`
          : `CRM responded with HTTP ${res.status}`,
      })
    } catch (e: any) {
      return NextResponse.json({ ok: false, message: `Could not reach CRM API: ${e?.message || 'network error'}` })
    }
  }

  // ── SYNC MODE ──
  if (!settings?.is_enabled) {
    return NextResponse.json({ ok: false, message: 'CRM integration is disabled. Enable it in settings first.' })
  }

  try {
    const res = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(30000) })
    if (!res.ok) {
      await logSyncStatus(supabase, settings.id, `Failed: HTTP ${res.status}`)
      return NextResponse.json({ ok: false, message: `CRM responded with HTTP ${res.status}` })
    }

    const raw = await res.json()
    // Accept either a plain array or { data: [...] } / { customers: [...] }
    const list: any[] = Array.isArray(raw) ? raw : (raw?.data || raw?.customers || raw?.results || [])
    if (!Array.isArray(list) || list.length === 0) {
      await logSyncStatus(supabase, settings.id, 'No customers returned')
      return NextResponse.json({ ok: true, message: 'CRM connected, but returned 0 customers.' })
    }

    // Field mapping (configurable in crm_settings.field_mapping)
    const mapping = settings.field_mapping || { name: 'name', phone: 'phone', email: 'email' }

    let inserted = 0, updated = 0, skipped = 0
    const capped = list.slice(0, 2000) // safety cap per sync

    const CHUNK = 200
    for (let i = 0; i < capped.length; i += CHUNK) {
      const chunk = capped.slice(i, i + CHUNK)
      const records = chunk
        .map(item => ({
          name: String(item[mapping.name] ?? '').trim(),
          phone: normalizePhone(item[mapping.phone] ?? ''),
          email: item[mapping.email] ? String(item[mapping.email]).trim() : null,
        }))
        .filter(r => r.phone && r.phone.length >= 5)

      skipped += chunk.length - records.length
      if (records.length === 0) continue

      const phones = records.map(r => r.phone)
      const { data: existing } = await supabase.from('contacts').select('id, phone').in('phone', phones)
      const existingMap = new Map((existing || []).map(e => [e.phone, e.id]))

      const toInsert = records.filter(r => !existingMap.has(r.phone))
      const toUpdate = records.filter(r => existingMap.has(r.phone))

      if (toInsert.length > 0) {
        const { error } = await supabase.from('contacts').insert(
          toInsert.map(r => ({
            name: r.name || r.phone,
            phone: r.phone,
            email: r.email,
            customer_type: settings.default_customer_type || null,
            source: 'crm',
          }))
        )
        if (!error) inserted += toInsert.length; else skipped += toInsert.length
      }
      for (const r of toUpdate) {
        const upd: any = { source: 'crm' }
        if (r.name) upd.name = r.name
        if (r.email) upd.email = r.email
        const { error } = await supabase.from('contacts').update(upd).eq('id', existingMap.get(r.phone)!)
        if (!error) updated++; else skipped++
      }
    }

    const message = `Synced ✓ — ${inserted} new, ${updated} updated, ${skipped} skipped`
    await logSyncStatus(supabase, settings.id, message)
    return NextResponse.json({ ok: true, message, inserted, updated, skipped })
  } catch (e: any) {
    await logSyncStatus(supabase, settings.id, `Failed: ${e?.message || 'error'}`)
    return NextResponse.json({ ok: false, message: `Sync failed: ${e?.message || 'network error'}` })
  }
}

async function logSyncStatus(supabase: any, id: string, status: string) {
  await supabase.from('crm_settings').update({
    last_sync_at: new Date().toISOString(),
    last_sync_status: status,
  }).eq('id', id)
}
