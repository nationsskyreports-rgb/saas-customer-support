'use client'

export interface AuthAgent {
  id: string
  name: string
  email: string
  role: string
  status: string
  max_chats: number
}

const KEY = 'nos_agent'

export function getAgent(): AuthAgent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setAgent(agent: AuthAgent) {
  localStorage.setItem(KEY, JSON.stringify(agent))
}

export function clearAgent() {
  localStorage.removeItem(KEY)
}

export function isAdmin(): boolean {
  // legacy 'admin' + any role whose name contains "admin"
  // (Super Admin / NOS Admin / Semi Admin)
  const role = (getAgent()?.role || '').toLowerCase()
  return role.includes('admin')
}
