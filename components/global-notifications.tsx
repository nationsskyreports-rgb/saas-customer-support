'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, X, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Toast {
  id: number
  title: string
  body: string
  time: string
}

export function GlobalNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [status, setStatus] = useState<'connecting' | 'live' | 'error'>('connecting')
  const toastIdRef = useRef(0)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const router = useRouter()

  // Browsers block audio until the user interacts with the page.
  // Create ONE shared AudioContext and unlock it on the first
  // click/keypress, then reuse it for every notification.
  useEffect(() => {
    const unlock = () => {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
      } catch {}
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const playSound = async () => {
    try {
      let ctx = audioCtxRef.current
      if (!ctx) {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioCtxRef.current = ctx
      }
      if (ctx.state === 'suspended') await ctx.resume()

      // pleasant two-tone "ding-dong" chime
      const now = ctx.currentTime
      const tone = (freq: number, t0: number, dur: number, vol: number) => {
        const o = ctx!.createOscillator()
        const g = ctx!.createGain()
        o.type = 'sine'
        o.frequency.value = freq
        o.connect(g); g.connect(ctx!.destination)
        g.gain.setValueAtTime(0.0001, now + t0)
        g.gain.exponentialRampToValueAtTime(vol, now + t0 + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, now + t0 + dur)
        o.start(now + t0); o.stop(now + t0 + dur + 0.05)
      }
      tone(740, 0,    0.35, 0.35)
      tone(988, 0.13, 0.5,  0.35)
    } catch {}
  }

  useEffect(() => {
    console.log('[GlobalNotifications] mounting subscription...')
    const ch = supabase
      .channel('global-message-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        console.log('[GlobalNotifications] message received:', payload.new)
        const msg = payload.new as any
        if (msg.direction !== 'inbound') return

        window.dispatchEvent(new CustomEvent('nos-new-message'))

        let name = 'New message'
        try {
          const { data: conv } = await supabase
            .from('conversations')
            .select('contacts(name)')
            .eq('id', msg.conversation_id)
            .single()
          const c = (conv as any)?.contacts
          if (c?.name) name = c.name
        } catch {}

        playSound()

        const id = ++toastIdRef.current
        const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        setToasts(prev => [...prev, { id, title: name, body: msg.content || 'New message', time }])

        if ('Notification' in window && Notification.permission === 'granted') {
          const n = new Notification(name, {
            body: msg.content || 'New message',
            icon: '/icon-light-32x32.png',
            requireInteraction: true,
          })
          n.onclick = () => { window.focus(); router.push('/inbox'); n.close() }
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

  return (
    <>
      {/* Status indicator — bottom right corner */}
      <div className="fixed bottom-4 right-4 z-[99] flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-lg text-xs font-medium">
        <Bell className="w-3.5 h-3.5 text-gray-400" />
        {status === 'live' && <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-green-600">Notifications Live</span></>}
        {status === 'connecting' && <><span className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-yellow-600">Connecting...</span></>}
        {status === 'error' && <><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-red-600">Realtime Error</span></>}
      </div>

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
              onClick={() => { router.push('/inbox'); dismiss(toast.id) }}
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
