'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { setAgent } from '@/lib/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setError('')

    const { data, error: dbErr } = await supabase
      .from('agents')
      .select('id, name, email, role, status, max_chats, password, is_active')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()

    if (dbErr || !data) {
      setError('Email not found')
      setLoading(false)
      return
    }
    if (!data.is_active) {
      setError('This account is deactivated')
      setLoading(false)
      return
    }
    if (data.password !== password) {
      setError('Wrong password')
      setLoading(false)
      return
    }

    // Set agent online
    await supabase.from('agents').update({ status: 'online' }).eq('id', data.id)

    setAgent({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      status: 'online',
      max_chats: data.max_chats,
    })
    router.replace('/dashboard')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8F4E8' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-white shadow" >
            <img src="/logo-transparent.png" alt="NOS" width={40} height={40} style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nations Of Sky</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="you@nos.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#C0992F' }}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
