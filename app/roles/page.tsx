'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, RefreshCw, X, Save, Shield, CheckSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ─── Pages + Operations ───────────────────────────────────────
const PAGES = [
  'Dashboard', 'Agents', 'Terms & Roles', 'Channels',
  'Inbox', 'All Conversations', 'Monitoring', 'Campaigns',
  'Pre-Messages', 'Agent Statuses', 'Log Categories',
  'Teams', 'Groups', 'Templates', 'Reports',
]

const OPS = ['can_add', 'can_search', 'can_delete', 'can_update', 'can_export'] as const
type Op = typeof OPS[number]

const OP_LABELS: Record<Op, string> = {
  can_add:    'Add',
  can_search: 'Search',
  can_delete: 'Delete',
  can_update: 'Update',
  can_export: 'Export',
}

type Permission = Record<Op, boolean>
type PermissionsMap = Record<string, Permission>

const emptyPerms = (): PermissionsMap =>
  Object.fromEntries(PAGES.map(p => [p, { can_add: false, can_search: false, can_delete: false, can_update: false, can_export: false }]))

// ─── Types ────────────────────────────────────────────────────
interface Role { id: string; name: string; created_at: string }
interface RolePermission { page: string; can_add: boolean; can_search: boolean; can_delete: boolean; can_update: boolean; can_export: boolean }

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [roleName, setRoleName] = useState('')
  const [perms, setPerms] = useState<PermissionsMap>(emptyPerms())
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Role | null>(null)

  // ─── Fetch ────────────────────────────────────────────────
  const fetchRoles = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('roles').select('*').order('name')
    if (data) setRoles(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchRoles() }, [fetchRoles])

  // ─── Open Add ─────────────────────────────────────────────
  const openAdd = () => {
    setEditRole(null)
    setRoleName('')
    setPerms(emptyPerms())
    setDrawerOpen(true)
  }

  // ─── Open Edit ────────────────────────────────────────────
  const openEdit = async (role: Role) => {
    setEditRole(role)
    setRoleName(role.name)
    const map = emptyPerms()
    const { data } = await supabase.from('role_permissions').select('*').eq('role_id', role.id)
    if (data) {
      data.forEach((rp: RolePermission & { role_id: string }) => {
        if (map[rp.page]) {
          map[rp.page] = { can_add: rp.can_add, can_search: rp.can_search, can_delete: rp.can_delete, can_update: rp.can_update, can_export: rp.can_export }
        }
      })
    }
    setPerms(map)
    setDrawerOpen(true)
  }

  // ─── Toggle single permission ──────────────────────────────
  const togglePerm = (page: string, op: Op) => {
    setPerms(prev => ({ ...prev, [page]: { ...prev[page], [op]: !prev[page][op] } }))
  }

  // ─── Toggle all ops for a page ─────────────────────────────
  const toggleRow = (page: string) => {
    const allOn = OPS.every(op => perms[page][op])
    setPerms(prev => ({
      ...prev,
      [page]: Object.fromEntries(OPS.map(op => [op, !allOn])) as Permission
    }))
  }

  // ─── Toggle all ops for a column ──────────────────────────
  const toggleCol = (op: Op) => {
    const allOn = PAGES.every(p => perms[p][op])
    setPerms(prev => {
      const next = { ...prev }
      PAGES.forEach(p => { next[p] = { ...next[p], [op]: !allOn } })
      return next
    })
  }

  // ─── Toggle ALL ────────────────────────────────────────────
  const toggleAll = () => {
    const allOn = PAGES.every(p => OPS.every(op => perms[p][op]))
    setPerms(Object.fromEntries(PAGES.map(p => [p, Object.fromEntries(OPS.map(op => [op, !allOn])) as Permission])))
  }

  const allSelected = PAGES.every(p => OPS.every(op => perms[p][op]))

  // ─── Save ─────────────────────────────────────────────────
  const save = async () => {
    if (!roleName.trim()) return
    setSaving(true)
    let roleId = editRole?.id

    if (editRole) {
      await supabase.from('roles').update({ name: roleName }).eq('id', editRole.id)
      await supabase.from('role_permissions').delete().eq('role_id', editRole.id)
    } else {
      const { data } = await supabase.from('roles').insert({ name: roleName }).select().single()
      roleId = data?.id
    }

    if (roleId) {
      const rows = PAGES.map(page => ({
        role_id: roleId,
        page,
        ...perms[page],
      }))
      await supabase.from('role_permissions').insert(rows)
    }

    setSaving(false)
    setDrawerOpen(false)
    fetchRoles()
  }

  // ─── Delete ───────────────────────────────────────────────
  const deleteRole = async () => {
    if (!confirmDelete) return
    await supabase.from('role_permissions').delete().eq('role_id', confirmDelete.id)
    await supabase.from('roles').delete().eq('id', confirmDelete.id)
    setConfirmDelete(null)
    fetchRoles()
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Terms & Roles</h1>
          <p className="text-sm text-gray-400 mt-1">Define roles and granular page permissions</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#00B69B' }}
        >
          <Plus className="w-4 h-4" />
          Add Role
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900">
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Created</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roles.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-400">
                    No roles yet. Click "Add Role" to create one.
                  </td>
                </tr>
              )}
              {roles.map(role => (
                <tr key={role.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-[#00B69B]" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{role.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(role.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(role)} className="text-sm text-[#00B69B] hover:underline font-medium mr-4">Edit</button>
                    <button onClick={() => setConfirmDelete(role)} className="text-sm text-red-500 hover:underline font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">1 – {roles.length} of {roles.length}</p>
          </div>
        </div>
      )}

      {/* ─── DRAWER: Add / Edit Role ─── */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setDrawerOpen(false)}>
          <div className="w-[700px] h-full bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>

            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                {editRole ? 'Edit Role' : 'Add New Role'}
              </h2>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role Name</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={e => setRoleName(e.target.value)}
                  placeholder="e.g. NOS Admin, Semi Admin..."
                  className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>

              {/* Permissions Matrix */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Privileges</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Manage page-level permissions for this role</p>
                  </div>
                  <button
                    onClick={toggleAll}
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors',
                      allSelected
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide w-44">Page</th>
                        {OPS.map(op => (
                          <th key={op} className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            <button onClick={() => toggleCol(op)} className="hover:text-[#00B69B] transition-colors">
                              {OP_LABELS[op]}
                            </button>
                          </th>
                        ))}
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">All</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {PAGES.map(page => {
                        const rowAllOn = OPS.every(op => perms[page][op])
                        return (
                          <tr key={page} className="hover:bg-emerald-50/30 transition-colors">
                            <td className="px-4 py-3 text-sm text-gray-700 font-medium">{page}</td>
                            {OPS.map(op => (
                              <td key={op} className="px-3 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={perms[page][op]}
                                  onChange={() => togglePerm(page, op)}
                                  className="w-4 h-4 rounded border-gray-300 accent-[#00B69B] cursor-pointer"
                                />
                              </td>
                            ))}
                            {/* Check all row */}
                            <td className="px-3 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={rowAllOn}
                                onChange={() => toggleRow(page)}
                                className="w-4 h-4 rounded border-gray-300 accent-[#00B69B] cursor-pointer"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !roleName.trim()}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#00B69B' }}
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM ─── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Role?</h3>
            <p className="text-sm text-gray-500 mb-1">
              You are about to delete <span className="font-semibold text-gray-900">{confirmDelete.name}</span>.
            </p>
            <p className="text-sm text-gray-400 mb-6">All permissions linked to this role will be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={deleteRole}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
