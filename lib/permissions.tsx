'use client'

/**
 * ─── Role-Based Access Control (RBAC) ─────────────────────────
 * Loads the logged-in agent's role permissions (saved from the
 * Terms & Roles page into `roles` + `role_permissions`) and makes
 * them available app-wide:
 *
 *   const { can, canView, isSuperAdmin, loading } = usePermissions()
 *   can('Agents', 'can_delete')  → boolean
 *   canView('Reports')           → boolean (has ANY permission on it)
 *
 * Notes:
 * - "Search" (can_search) is treated as the base View/Read permission.
 * - Super Admin (or legacy role string 'admin') always has full access
 *   as a failsafe so you can never lock yourself out.
 * - Legacy agents.role values are mapped:  'admin' → Super Admin,
 *   'agent' → NOS Agent.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getAgent } from '@/lib/auth'

export const OPS = ['can_add', 'can_search', 'can_delete', 'can_update', 'can_export'] as const
export type Op = typeof OPS[number]

export type Permission = Record<Op, boolean>
export type PermissionsMap = Record<string, Permission>

// route → page name used in role_permissions.page
export const ROUTE_PAGE_MAP: Array<{ prefix: string; page: string }> = [
  { prefix: '/dashboard',      page: 'Dashboard' },
  { prefix: '/inbox/all',      page: 'All Conversations' },
  { prefix: '/inbox',          page: 'Inbox' },
  { prefix: '/my-resolved',    page: 'Inbox' },
  { prefix: '/monitoring',     page: 'Monitoring' },
  { prefix: '/agents',         page: 'Agents' },
  { prefix: '/roles',          page: 'Terms & Roles' },
  { prefix: '/teams',          page: 'Teams' },
  { prefix: '/groups',         page: 'Groups' },
  { prefix: '/agent-statuses', page: 'Agent Statuses' },
  { prefix: '/messages',       page: 'Pre-Messages' },
  { prefix: '/log-categories', page: 'Log Categories' },
  { prefix: '/channels',       page: 'Channels' },
  { prefix: '/conversations',  page: 'All Conversations' },
  { prefix: '/campaigns',      page: 'Campaigns' },
  { prefix: '/templates',      page: 'Templates' },
  { prefix: '/reports',        page: 'Reports' },
]

export function pageForRoute(pathname: string): string | null {
  const hit = ROUTE_PAGE_MAP.find(r => pathname === r.prefix || pathname.startsWith(r.prefix + '/'))
  return hit ? hit.page : null
}

// legacy agents.role strings → role names in the `roles` table
const LEGACY_ROLE_MAP: Record<string, string> = {
  admin: 'super admin',
  agent: 'nos agent',
}

const normalize = (s: string) => s.trim().toLowerCase()

interface PermissionsCtx {
  loading: boolean
  isSuperAdmin: boolean
  roleName: string | null
  can: (page: string, op: Op) => boolean
  canView: (page: string) => boolean
  refresh: () => Promise<void>
}

const Ctx = createContext<PermissionsCtx>({
  loading: true,
  isSuperAdmin: false,
  roleName: null,
  can: () => false,
  canView: () => false,
  refresh: async () => {},
})

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [roleName, setRoleName] = useState<string | null>(null)
  const [perms, setPerms] = useState<PermissionsMap>({})

  const load = useCallback(async () => {
    setLoading(true)
    const agent = getAgent()
    if (!agent) {
      setPerms({}); setIsSuperAdmin(false); setRoleName(null); setLoading(false)
      return
    }

    const raw = normalize(agent.role || '')
    const target = LEGACY_ROLE_MAP[raw] || raw
    setRoleName(agent.role)

    // Super Admin failsafe — full access, no lookup needed
    if (target === 'super admin') {
      setIsSuperAdmin(true); setPerms({}); setLoading(false)
      return
    }
    setIsSuperAdmin(false)

    // find the role row by name (case-insensitive)
    const { data: roles } = await supabase.from('roles').select('id, name')
    const roleRow = roles?.find(r => normalize(r.name) === target)

    if (!roleRow) {
      // Unknown role → no explicit permissions (Inbox stays reachable via fallback below)
      setPerms({}); setLoading(false)
      return
    }

    const { data: rows } = await supabase
      .from('role_permissions')
      .select('page, can_add, can_search, can_delete, can_update, can_export')
      .eq('role_id', roleRow.id)

    const map: PermissionsMap = {}
    rows?.forEach(r => {
      map[r.page] = {
        can_add: !!r.can_add,
        can_search: !!r.can_search,
        can_delete: !!r.can_delete,
        can_update: !!r.can_update,
        can_export: !!r.can_export,
      }
    })
    setPerms(map)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const can = useCallback((page: string, op: Op): boolean => {
    if (isSuperAdmin) return true
    return !!perms[page]?.[op]
  }, [isSuperAdmin, perms])

  const canView = useCallback((page: string): boolean => {
    if (isSuperAdmin) return true
    const p = perms[page]
    if (!p) {
      // Fallback: agents with no configured role still get their own inbox
      return page === 'Inbox' || page === 'Dashboard'
    }
    return OPS.some(op => p[op])
  }, [isSuperAdmin, perms])

  return (
    <Ctx.Provider value={{ loading, isSuperAdmin, roleName, can, canView, refresh: load }}>
      {children}
    </Ctx.Provider>
  )
}

export function usePermissions() {
  return useContext(Ctx)
}

/** Full-page "no access" screen used by the route guard */
export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(0, 182, 155, 0.1)' }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#00B69B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access restricted</h2>
      <p className="text-sm text-gray-500 max-w-sm">
        Your role doesn&apos;t have permission to view this page. Contact your administrator if you think this is a mistake.
      </p>
    </div>
  )
}
