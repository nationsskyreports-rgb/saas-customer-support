'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Settings, ChevronDown, LogOut, Moon, Sun } from 'lucide-react'
import { useSidebar } from '@/lib/sidebar-context'
import { useTheme } from '@/lib/theme-context'
import { getAgent, setAgent, clearAgent, AuthAgent, isAdmin } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { drainQueueToAgent, releaseAgentChats } from '@/lib/routing'

interface NotifRow {
  id: string
  title: string
  body: string | null
  is_read: boolean
  created_at: string
  conversation_id?: string | null
}

export function TopNav() {
  const [statusOpen, setStatusOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotifRow[]>([])
  const [unread, setUnread] = useState(0)
  const [agentStatus, setAgentStatus] = useState('Active')
  const [me, setMe] = useState<AuthAgent | null>(null)
  const { collapsed } = useSidebar()
  const { dark, toggleDark } = useTheme()
  const router = useRouter()

  const statuses = [
    { label: 'Active', value: 'online', color: 'bg-green-500' },
    { label: 'Busy', value: 'busy', color: 'bg-yellow-500' },
    { label: 'Away', value: 'away', color: 'bg-gray-400' },
    { label: 'Offline', value: 'offline', color: 'bg-red-500' },
  ]

  useEffect(() => {
    const agent = getAgent()
    if (!agent) return
    setMe(agent)
    // Read the REAL current status from the database (not the cached one)
    supabase
      .from('agents')
      .select('status')
      .eq('id', agent.id)
      .single()
      .then(({ data }) => {
        if (data?.status) {
          const s = statuses.find(x => x.value === data.status)
          if (s) setAgentStatus(s.label)
          setAgent({ ...agent, status: data.status })
        }
      })
  }, [])

  // ─── Notification Center: load + live updates ───
  const loadNotifs = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, is_read, created_at, conversation_id')
      .order('created_at', { ascending: false })
      .limit(50)

    // Per-viewer filtering: agents only see their own / unassigned conversations
    let visible = data || []
    const me = getAgent()
    if (!isAdmin() && me?.id && visible.length > 0) {
      const convIds = [...new Set(visible.map((n: any) => n.conversation_id).filter(Boolean))]
      if (convIds.length > 0) {
        const { data: convs } = await supabase
          .from('conversations').select('id, assigned_agent_id').in('id', convIds)
        const assignedMap = new Map((convs || []).map(c => [c.id, c.assigned_agent_id]))
        visible = visible.filter((n: any) => {
          if (!n.conversation_id) return true
          const a = assignedMap.get(n.conversation_id)
          return !a || a === me.id
        })
      }
    }

    setNotifs(visible.slice(0, 12))
    setUnread(visible.filter((n: any) => !n.is_read).length)
  }

  useEffect(() => {
    loadNotifs()
    const ch = supabase
      .channel('topnav-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => loadNotifs())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    loadNotifs()
  }

  const openNotif = async (n: NotifRow) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
    setNotifOpen(false)
    const base = isAdmin() ? '/inbox/all' : '/inbox'
    router.push((n as any).conversation_id ? `${base}?conv=${(n as any).conversation_id}` : base)
  }

  const timeAgo = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const getStatusColor = () => {
    const status = statuses.find(s => s.label === agentStatus)
    return status?.color || 'bg-green-500'
  }

  // ── Sync the badge when status changes elsewhere (e.g. "Go Online" in the chat panel) ──
  useEffect(() => {
    const onEvt = (e: Event) => {
      const v = (e as CustomEvent).detail
      const s = statuses.find(x => x.value === v)
      if (s) setAgentStatus(s.label)
    }
    window.addEventListener('nos-status-changed', onEvt)
    return () => window.removeEventListener('nos-status-changed', onEvt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const changeStatus = async (status: { label: string; value: string }) => {
    setAgentStatus(status.label)
    setStatusOpen(false)
    localStorage.setItem('nos_last_status', status.value) // remembered for next login
    if (me) {
      await supabase.from('agents').update({ status: status.value }).eq('id', me.id)
      setAgent({ ...me, status: status.value })
      window.dispatchEvent(new CustomEvent('nos-status-changed', { detail: status.value }))
      // ── ROUTING LIFECYCLE ──
      if (status.value === 'online') {
        drainQueueToAgent(me.id)      // pull waiting chats from the queue (FIFO)
      } else if (status.value === 'offline') {
        releaseAgentChats(me.id)      // hand my open chats to online colleagues / queue
      }
    }
  }

  const signOut = async () => {
    if (me) {
      await releaseAgentChats(me.id) // hand over my chats before leaving
      await supabase.from('agents').update({ status: 'offline' }).eq('id', me.id)
    }
    clearAgent()
    router.replace('/login')
  }

  const initials = me ? me.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??'

  return (
    <>
      <div
        className="fixed right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40 transition-all duration-300 ease-in-out"
        style={{ top: '3px', left: collapsed ? '60px' : '240px' }}
      >
      {/* Left side */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDark}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={dark ? 'Light Mode' : 'Dark Mode'}
        >
          {dark ? (
            <Sun className="w-5 h-5 text-emerald-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* ─── Notification bell + dropdown ─── */}
        <div className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Notifications">
            <Bell className="w-5 h-5 text-gray-700" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <p className="font-bold text-sm text-gray-900">Notifications</p>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs font-medium" style={{ color: '#00B69B' }}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[380px] overflow-y-auto">
                  {notifs.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-10">No notifications yet</p>
                  )}
                  {notifs.map(n => (
                    <button key={n.id} onClick={() => openNotif(n)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${!n.is_read ? 'bg-emerald-50/60' : ''}`}>
                      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.is_read ? 'bg-emerald-500' : 'bg-transparent'}`} />
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${!n.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>{n.title}</span>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(n.created_at)}</span>
                        </span>
                        <span className="block text-xs text-gray-500 truncate">{n.body}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <button onClick={() => { setNotifOpen(false); router.push('/notifications') }}
                  className="w-full py-2.5 text-xs font-semibold border-t border-gray-100 hover:bg-gray-50" style={{ color: '#00B69B' }}>
                  View all notifications
                </button>
              </div>
            </>
          )}
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Settings">
          <Settings className="w-5 h-5 text-gray-700" />
        </button>

        {/* Agent Status Pill */}
        <div className="relative">
          <button
            onClick={() => setStatusOpen(!statusOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <span className="text-sm font-medium text-gray-700">{agentStatus}</span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>

          {statusOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-2">
                {statuses.map((status) => (
                  <button
                    key={status.label}
                    onClick={() => changeStatus(status)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 transition-colors text-sm text-gray-700"
                  >
                    <div className={`w-2 h-2 rounded-full ${status.color}`} />
                    <span>{status.label}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-200" />
              <div className="p-2">
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 transition-colors text-sm text-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Agent Avatar and Name */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div style={{ width: '36px', height: '36px', backgroundColor: '#00B69B', borderRadius: '50%' }} className="text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
            {initials}
          </div>
          <span className="text-sm font-medium text-gray-600">{me?.name || ''}</span>
        </div>
      </div>
      </div>
    </>
  )
}
