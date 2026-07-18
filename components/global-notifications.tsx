'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, X, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { isAdmin, getAgent } from '@/lib/auth'

interface Toast {
  id: number
  title: string
  body: string
  time: string
  conversationId?: string | null
}

export function GlobalNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [status, setStatus] = useState<'connecting' | 'live' | 'error'>('connecting')
  const toastIdRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const router = useRouter()

  // Real audio file — far more reliable than WebAudio oscillators.
  // On the first user interaction we do a silent play/pause to unlock
  // media playback for the rest of the session.
  useEffect(() => {
    const a = new Audio('/notification.wav')
    a.volume = 0.8
    a.preload = 'auto'
    audioRef.current = a

    const unlock = () => {
      const el = audioRef.current
      if (!el) return
      el.muted = true
      el.play().then(() => {
        el.pause(); el.currentTime = 0; el.muted = false
      }).catch(() => { el.muted = false })
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  const [notifPerm, setNotifPerm] = useState<NotificationPermission | 'unsupported'>('default')

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifPerm('unsupported')
      return
    }
    setNotifPerm(Notification.permission)
  }, [])

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) return
    const res = await Notification.requestPermission()
    setNotifPerm(res)
  }

  const playSound = () => {
    const a = audioRef.current
    if (!a) return
    try { a.currentTime = 0 } catch {}
    a.play().catch(() => {})
  }

  useEffect(() => {
    console.log('[GlobalNotifications] mounting subscription...')
    const ch = supabase
      .channel('global-message-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        console.log('[GlobalNotifications] message received:', payload.new)
        const msg = payload.new as any
        if (msg.direction !== 'inbound') return

        // Refresh open lists everywhere (harmless for all viewers)
        window.dispatchEvent(new CustomEvent('nos-new-message'))

        const me = getAgent()
        if (!me?.id) return

        // Who is this conversation for — and am I even on duty?
        let name = 'New message'
        let assignedTo: string | null = null
        let myStatus = 'offline'
        try {
          const [convRes, meRes] = await Promise.all([
            supabase.from('conversations').select('assigned_agent_id, contacts(name)').eq('id', msg.conversation_id).single(),
            supabase.from('agents').select('status').eq('id', me.id).single(),
          ])
          assignedTo = (convRes.data as any)?.assigned_agent_id ?? null
          const c = (convRes.data as any)?.contacts
          if (c?.name) name = c.name
          myStatus = (meRes.data as any)?.status || 'offline'
        } catch {}

        // Record in the Notification Center regardless (event log; per-viewer
        // filtering happens where notifications are displayed)
        supabase.from('notifications').upsert({
          message_id: String(msg.id),
          conversation_id: msg.conversation_id,
          title: name,
          body: msg.content || 'New message',
        }, { onConflict: 'message_id', ignoreDuplicates: true }).then(({ error }) => {
          if (error) console.error('[Notifications] failed to save:', error.message)
        })

        // ── TARGETING RULES ──
        // 1) Off-duty agents get nothing — offline means offline.
        if (myStatus === 'offline') return
        // 2) Assigned to somebody else → not my notification (admins see all).
        if (assignedTo && assignedTo !== me.id && !isAdmin()) return
        // (unassigned → everyone on duty is notified so someone picks it up)

        playSound()

        const id = ++toastIdRef.current
        const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        setToasts(prev => [...prev, { id, title: name, body: msg.content || 'New message', time, conversationId: msg.conversation_id }])

        if ('Notification' in window && Notification.permission === 'granted') {
          const n = new Notification(`💬 ${name}`, {
            body: msg.content || 'New message',
            icon: '/logo-transparent.png',
            badge: '/logo-transparent.png',
            tag: `nos-msg-${msg.conversation_id}`,  // group per conversation
            renotify: true,                          // re-alert even with same tag
            requireInteraction: true,                // stays until dismissed
            silent: false,
          } as NotificationOptions)
          n.onclick = () => {
            window.focus()
            const base = isAdmin() ? '/inbox/all' : '/inbox'
            router.push(msg.conversation_id ? `${base}?conv=${msg.conversation_id}` : base)
            n.close()
          }
        }
      })
      .subscribe((s) => {
        console.log('[GlobalNotifications] subscription status:', s)
        if (s === 'SUBSCRIBED') setStatus('live')
        else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') setStatus('error')
      })
    return () => { supabase.removeChannel(ch) }
  }, [])

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))
  const dismissAll = () => setToasts([])

  // ─── Keep ringing while there are unseen alerts and the tab
  //     is in the background — like a phone, until you come back ───
  useEffect(() => {
    if (toasts.length === 0) return
    const iv = setInterval(() => {
      if (document.hidden) playSound()
    }, 9000)
    return () => clearInterval(iv)
  }, [toasts.length])

  // ─── Flash the browser-tab title so it screams for attention
  //     even from another tab: 🔴 (2) New message! ───
  useEffect(() => {
    if (toasts.length === 0) return
    const original = document.title
    let flip = false
    const iv = setInterval(() => {
      if (document.hidden) {
        flip = !flip
        document.title = flip ? `🔴 (${toasts.length}) New message!` : original
      } else if (document.title !== original) {
        document.title = original
      }
    }, 1200)
    const onVis = () => { if (!document.hidden) document.title = original }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(iv)
      document.title = original
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [toasts.length])

  return (
    <>
      {/* Status indicator — bottom right corner */}
      <div className="fixed bottom-4 right-4 z-[99] flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-lg text-xs font-medium">
        <Bell className="w-3.5 h-3.5 text-gray-400" />
        {status === 'live' && <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-green-600">Notifications Live</span></>}
        {status === 'connecting' && <><span className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-yellow-600">Connecting...</span></>}
        {status === 'error' && <><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-red-600">Realtime Error</span></>}
      </div>

      {/* Enable-desktop-notifications banner */}
      {notifPerm === 'default' && (
        <div className="fixed top-16 right-4 z-[101] bg-white rounded-2xl border p-4 shadow-xl"
          style={{ width: '340px', borderColor: 'rgba(59, 130, 246, 0.35)' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900">Enable desktop alerts</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                Get message popups on your screen even when this tab is in the background.
              </p>
              <button onClick={requestNotifPermission}
                className="mt-2.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: 'linear-gradient(90deg, #00B69B, #3B82F6)' }}>
                Enable now
              </button>
            </div>
          </div>
        </div>
      )}
      {notifPerm === 'denied' && (
        <div className="fixed top-16 right-4 z-[101] bg-white rounded-2xl border border-red-200 p-3.5 shadow-xl"
          style={{ width: '340px' }}>
          <p className="text-xs text-gray-600 leading-snug">
            🔕 Desktop notifications are <b>blocked</b>. Click the lock icon 🔒 next to the address bar → Notifications → <b>Allow</b>, then reload.
          </p>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed top-16 right-4 z-[100] space-y-2" style={{ maxWidth: '340px', width: '340px' }}>
        {toasts.length > 1 && (
          <button onClick={dismissAll} className="w-full text-center text-xs font-medium text-gray-500 bg-white/90 border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 shadow">
            Clear all ({toasts.length})
          </button>
        )}
        <div className="space-y-2.5 max-h-[70vh] overflow-y-auto">
          {toasts.map(toast => (
            <div key={toast.id}
              onClick={() => {
                const base = isAdmin() ? '/inbox/all' : '/inbox'
                router.push(toast.conversationId ? `${base}?conv=${toast.conversationId}` : base)
                dismiss(toast.id)
              }}
              className="relative overflow-hidden bg-white rounded-2xl border cursor-pointer transition-transform hover:scale-[1.02]"
              style={{
                animation: 'nosSlideIn 0.35s cubic-bezier(0.21, 1.02, 0.73, 1)',
                borderColor: 'rgba(0, 182, 155, 0.35)',
                boxShadow: '0 8px 30px -6px rgba(13, 35, 67, 0.25), 0 0 0 1px rgba(0, 182, 155, 0.08), 0 0 24px rgba(0, 182, 155, 0.12)',
              }}>
              {/* accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ background: 'linear-gradient(180deg, #00B69B, #3B82F6)' }} />

              <div className="p-4 pl-5 flex items-start gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-md"
                  style={{ background: 'linear-gradient(135deg, #00B69B, #0E9F8A)' }}>
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#00B69B' }}>
                      New message
                    </span>
                    <span className="text-[10px] text-gray-400 ml-auto flex-shrink-0">{toast.time}</span>
                  </div>
                  <p className="font-bold text-[15px] text-gray-900 truncate">{toast.title}</p>
                  <p className="text-sm text-gray-600 leading-snug" style={{
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{toast.body}</p>
                  <p className="text-[11px] font-medium mt-1.5" style={{ color: '#3B82F6' }}>
                    Click to open in Inbox →
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); dismiss(toast.id) }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0 transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <style jsx global>{`
          @keyframes nosSlideIn {
            from { transform: translateX(110%) scale(0.96); opacity: 0; }
            60%  { transform: translateX(-6px) scale(1); }
            to   { transform: translateX(0) scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </>
  )
}
