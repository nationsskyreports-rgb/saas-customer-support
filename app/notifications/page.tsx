'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, MessageCircle, Volume2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/auth'

interface NotifRow {
  id: string
  conversation_id: string | null
  title: string
  body: string | null
  is_read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<NotifRow[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const load = async () => {
    setLoading(true)
    let q = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (filter === 'unread') q = q.eq('is_read', false)
    const { data } = await q
    if (data) setNotifs(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  useEffect(() => {
    const ch = supabase
      .channel('notifications-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [filter])

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    load()
  }

  const open = async (n: NotifRow) => {
    if (!n.is_read) await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
    // Role-aware deep-link: admins land in All Conversations (they can see any
    // chat there); agents land in their own inbox.
    const base = isAdmin() ? '/inbox/all' : '/inbox'
    router.push(n.conversation_id ? `${base}?conv=${n.conversation_id}` : base)
  }

  const unreadCount = notifs.filter(n => !n.is_read).length

  // ─── Desktop notification self-test ───
  const [perm, setPerm] = useState<string>('...')
  const [testMsg, setTestMsg] = useState('')

  useEffect(() => {
    setPerm('Notification' in window ? Notification.permission : 'unsupported')
  }, [])

  const sendTest = async () => {
    setTestMsg('')
    try { new Audio('/notification.wav').play().catch(() => {}) } catch {}

    if (!('Notification' in window)) { setTestMsg('❌ This browser does not support notifications'); return }
    let p = Notification.permission
    if (p === 'default') { p = await Notification.requestPermission(); setPerm(p) }
    if (p === 'denied') {
      setTestMsg('❌ Blocked in this browser — click the 🔒 lock next to the address bar → Notifications → Allow, then reload')
      return
    }
    new Notification('🔔 SoloTec test notification', {
      body: 'If you can see this on your screen, desktop alerts are working!',
      icon: '/logo-transparent.png',
      requireInteraction: true,
    })
    setTestMsg('✅ Test sent! If nothing appeared bottom-right of your screen, Windows is blocking it → Settings → System → Notifications: turn ON for this browser + turn OFF Do Not Disturb')
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6" style={{ color: '#00B69B' }} />
            Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">Every incoming message alert, saved so you never miss one</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={sendTest}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
            title={`Browser permission: ${perm}`}>
            <Volume2 className="w-4 h-4" style={{ color: '#3B82F6' }} /> Test desktop alert
          </button>
          <button onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#00B69B' }}>
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        </div>
      </div>

      {testMsg && (
        <div className="mb-4 px-4 py-3 rounded-xl border text-sm leading-relaxed"
          style={testMsg.startsWith('✅')
            ? { background: 'rgba(0,182,155,0.07)', borderColor: 'rgba(0,182,155,0.3)', color: '#0B5F52' }
            : { background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.3)', color: '#991B1B' }}>
          {testMsg}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            filter === 'all' ? 'text-white border-transparent' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          style={filter === 'all' ? { backgroundColor: '#00B69B' } : {}}>
          All
        </button>
        <button onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            filter === 'unread' ? 'text-white border-transparent' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          style={filter === 'unread' ? { backgroundColor: '#00B69B' } : {}}>
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading && <p className="text-center text-sm text-gray-400 py-12">Loading…</p>}
        {!loading && notifs.length === 0 && (
          <div className="text-center py-14">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {filter === 'unread' ? 'No unread notifications 🎉' : 'No notifications yet'}
            </p>
          </div>
        )}
        {!loading && notifs.map(n => (
          <button key={n.id} onClick={() => open(n)}
            className={`w-full text-left px-5 py-4 flex items-start gap-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
              !n.is_read ? 'bg-emerald-50/50' : ''}`}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0"
              style={{ background: !n.is_read ? 'linear-gradient(135deg, #00B69B, #0E9F8A)' : '#CBD5E1' }}>
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm truncate ${!n.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                  {n.title}
                </p>
                <span className="text-[11px] text-gray-400 flex-shrink-0">{fmt(n.created_at)}</span>
              </div>
              <p className="text-sm text-gray-500 truncate mt-0.5">{n.body}</p>
            </div>
            {!n.is_read && <span className="mt-2 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  )
}
