'use client'

import { useState } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface InviteAgentModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InviteAgentModal({ isOpen, onClose }: InviteAgentModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'agent'>('agent')
  const [maxChats, setMaxChats] = useState(5)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleInvite = async () => {
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required')
      return
    }

    setSaving(true)
    setError('')

    const { error: dbError } = await supabase.from('agents').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      max_chats: maxChats,
      status: 'offline',
      is_active: true,
    })

    setSaving(false)

    if (dbError) {
      if (dbError.code === '23505') {
        setError('An agent with this email already exists')
      } else {
        setError(dbError.message)
      }
      return
    }

    setSuccess(true)
    setTimeout(() => {
      setName('')
      setEmail('')
      setRole('agent')
      setMaxChats(5)
      setSuccess(false)
      onClose()
      window.location.reload()
    }, 1000)
  }

  const handleClose = () => {
    setName('')
    setEmail('')
    setRole('agent')
    setMaxChats(5)
    setError('')
    setSuccess(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white rounded-xl max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Add New Agent</h2>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Success */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 font-medium">
              ✓ Agent added successfully!
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Mohamed Ali"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="agent@nationsofsky.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={role === 'agent'} onChange={() => setRole('agent')} className="accent-emerald-500" />
                <span className="text-sm text-gray-700">Agent</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={role === 'admin'} onChange={() => setRole('admin')} className="accent-emerald-500" />
                <span className="text-sm text-gray-700">Admin</span>
              </label>
            </div>
          </div>

          {/* Max Chats */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Concurrent Chats</label>
            <input
              type="number"
              value={maxChats}
              onChange={e => setMaxChats(Number(e.target.value))}
              min={1}
              max={20}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={handleClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={saving || !name.trim() || !email.trim()}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#00B69B' }}
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Adding...' : 'Add Agent'}
          </button>
        </div>
      </div>
    </div>
  )
}
