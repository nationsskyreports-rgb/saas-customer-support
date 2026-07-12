'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { MessageCircle, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Toast {
  id: number
  title: string
  body: string
}

export function GlobalNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdRef = useRef(0)
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const router = useRouter()

  useEffect(() => { pathnameRef.current = pathname }, [pathname])

  // Ask for browser notification permission once
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
    const ch = supabase
      .channel('global-message-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const msg = payload.new as any
        // Only customer (inbound) messages
        if (msg.direction !== 'inbound') return

        // Tell the sidebar to bump the badge
        window.dispatchEvent(new CustomEvent('nos-new-message'))

        // Get contact name
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

        // In-app toast
        const id = ++toastIdRef.current
        setToasts(prev => [...prev, { id, title: name, body: msg.content || 'New message' }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000)

        // Browser notification (works in background tabs)
        if ('Notification' in window && Notification.permission === 'granted') {
          const n = new Notification(name, { body: msg.content || 'New message', icon: '/icon-light-32x32.png' })
          n.onclick = () => { window.focus(); router.push('/inbox'); n.close() }
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  return (
    <div className="fixed top-16 right-4 z-[100] space-y-2" style={{ maxWidth: '340px' }}>
      {toasts.map(toast => (
        <div key={toast.id}
          onClick={() => { router.push('/inbox'); setToasts(prev => prev.filter(t => t.id !== toast.id)) }}
          className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex items-start gap-3 cursor-pointer hover:shadow-xl transition-all"
          style={{ animation: 'nosSlideIn 0.3s ease-out' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: '#C0992F' }}>
            <MessageCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-900 truncate">{toast.title}</p>
            <p className="text-sm text-gray-500 truncate">{toast.body}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setToasts(prev => prev.filter(t => t.id !== toast.id)) }}
            className="p-1 hover:bg-gray-100 rounded flex-shrink-0">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      ))}
      <style jsx global>{`
        @keyframes nosSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
