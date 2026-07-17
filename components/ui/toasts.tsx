'use client'

import { useState, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, X } from 'lucide-react'

export interface Toast { id: number; type: 'success' | 'error'; message: string }

/**
 * Shared toast system.
 * Usage:
 *   const { toasts, showToast, dismissToast } = useToasts()
 *   <Toasts toasts={toasts} dismiss={dismissToast} />
 *   showToast('error', 'Something failed')
 */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, showToast, dismissToast }
}

export function Toasts({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 w-96 max-w-[calc(100vw-2rem)]">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-start gap-2.5 rounded-xl px-4 py-3 shadow-lg border text-sm ${
            t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
          {t.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
            : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="flex-shrink-0 opacity-50 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
