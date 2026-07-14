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
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const playSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 880
      g.gain.setValueAtTime(0.15, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      o.start(); o.stop(ctx.currentTime + 0.4)
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
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {toasts.map(toast => (
            <div key={toast.id}
              onClick={() => { router.push('/inbox'); dismiss(toast.id) }}
              className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex items-start gap-3 cursor-pointer hover:shadow-xl transition-all"
              style={{ animation: 'nosSlideIn 0.3s ease-out' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: '#00B69B' }}>
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-sm text-gray-900 truncate">{toast.title}</p>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{toast.time}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{toast.body}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); dismiss(toast.id) }}
                className="p-1 hover:bg-gray-100 rounded flex-shrink-0">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
        <style jsx global>{`
          @keyframes nosSlideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </div>
    </>
  )
}
