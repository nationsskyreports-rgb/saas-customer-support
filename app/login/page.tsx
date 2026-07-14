'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Eye, EyeOff, ArrowRight } from 'lucide-react'
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

    const lastStatus = localStorage.getItem('nos_last_status') || 'online'
    await supabase.from('agents').update({ status: lastStatus }).eq('id', data.id)

    setAgent({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      status: lastStatus,
      max_chats: data.max_chats,
    })
    router.replace('/dashboard')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="min-h-screen flex bg-[#0B1120]">

      {/* ══════════ LEFT: Login Form ══════════ */}
      <div className="w-full lg:w-[480px] flex flex-col justify-center px-10 lg:px-14 bg-white relative z-10 rounded-r-none lg:rounded-r-3xl shadow-2xl">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          {/* Hexagon S */}
          <div className="relative w-11 h-11">
            <svg viewBox="0 0 48 48" className="w-full h-full">
              <defs>
                <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34E8A5" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <path
                d="M24 3 L42 13.5 V34.5 L24 45 L6 34.5 V13.5 Z"
                fill="none" stroke="url(#hexGrad)" strokeWidth="3.5" strokeLinejoin="round"
              />
              <text x="24" y="31" textAnchor="middle" fontSize="20" fontWeight="800" fill="url(#hexGrad)" fontFamily="Arial, sans-serif">S</text>
            </svg>
            {/* Floating dot */}
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#34E8A5] animate-pulse" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-gray-900">
            SoloTe<span className="text-[#00B69B]">c</span>
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
        <p className="text-gray-400 text-sm mb-9">Log in to get started.</p>

        {/* Email */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="you@solotec.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00B69B]/40 focus:border-[#00B69B] transition-all"
          />
        </div>

        {/* Password */}
        <div className="mb-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00B69B]/40 focus:border-[#00B69B] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 font-medium mb-3 animate-[shake_0.4s_ease]">{error}</p>
        )}

        {/* Forgot */}
        <div className="flex justify-end mb-7 mt-1">
          <button className="text-sm font-semibold text-gray-600 hover:text-[#00B69B] underline underline-offset-2 transition-colors">
            Forgot Password?
          </button>
        </div>

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={loading || !email.trim() || !password.trim()}
          className="w-full py-3.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:gap-3 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#00B69B]/25"
          style={{ background: 'linear-gradient(90deg, #00B69B 0%, #3B82F6 100%)' }}
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Login <ArrowRight className="w-4 h-4" /></>}
        </button>

        {/* Support */}
        <p className="text-sm text-gray-400 text-center mt-7">
          Having trouble logging in?{' '}
          <span className="text-gray-700 font-semibold underline underline-offset-2 cursor-pointer hover:text-[#00B69B] transition-colors">
            Contact Us
          </span>{' '}
          for support.
        </p>

        {/* Footer */}
        <p className="text-xs text-gray-300 text-center mt-12">
          All rights reserved for SoloTec © 2026
        </p>
      </div>

      {/* ══════════ RIGHT: 3D Animated Hero ══════════ */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at 30% 20%, #10243E 0%, #0B1120 55%, #060B16 100%)' }}>

        {/* ─── 3D Scene ─── */}
        <div className="scene">
          {/* Ring of rotating triangles */}
          <div className="tri-orbit">
            <div className="tri tri-1" />
            <div className="tri tri-2" />
            <div className="tri tri-3" />
          </div>

          {/* Center hexagon (spinning in 3D) */}
          <div className="hex-spin">
            <svg viewBox="0 0 120 120" width="190" height="190">
              <defs>
                <linearGradient id="heroHex" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34E8A5" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <path d="M60 8 L105 34 V86 L60 112 L15 86 V34 Z"
                fill="none" stroke="url(#heroHex)" strokeWidth="5" strokeLinejoin="round" />
              <text x="60" y="76" textAnchor="middle" fontSize="46" fontWeight="800"
                fill="url(#heroHex)" fontFamily="Arial, sans-serif">S</text>
            </svg>
          </div>

          {/* Floating dots */}
          <span className="dot dot-1" />
          <span className="dot dot-2" />
          <span className="dot dot-3" />
        </div>

        {/* ─── Text ─── */}
        <div className="absolute bottom-20 left-0 right-0 text-center px-12">
          <h2 className="text-3xl font-bold text-white leading-snug">
            Unlock <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg,#34E8A5,#3B82F6)' }}>insights</span> to optimize your WhatsApp strategy
          </h2>
          <p className="text-gray-400 mt-3 text-sm max-w-xl mx-auto">
            Access comprehensive analytics to refine your WhatsApp strategy for better results.
          </p>
        </div>

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        {/* ─── Animations CSS ─── */}
        <style jsx>{`
          .scene {
            position: relative;
            width: 420px;
            height: 420px;
            display: flex;
            align-items: center;
            justify-content: center;
            perspective: 1000px;
            margin-bottom: 120px;
          }

          /* ── Center hexagon: 3D tumble ── */
          .hex-spin {
            position: relative;
            z-index: 3;
            animation: hexTumble 14s ease-in-out infinite;
            transform-style: preserve-3d;
            filter: drop-shadow(0 0 28px rgba(52, 232, 165, 0.35));
          }
          @keyframes hexTumble {
            0%   { transform: rotateY(0deg) rotateX(0deg); }
            25%  { transform: rotateY(180deg) rotateX(8deg); }
            50%  { transform: rotateY(360deg) rotateX(0deg); }
            75%  { transform: rotateY(540deg) rotateX(-8deg); }
            100% { transform: rotateY(720deg) rotateX(0deg); }
          }

          /* ── Orbit of triangles interlocking ── */
          .tri-orbit {
            position: absolute;
            inset: 0;
            animation: orbitSpin 26s linear infinite;
            transform-style: preserve-3d;
            z-index: 2;
          }
          @keyframes orbitSpin {
            from { transform: rotateZ(0deg) rotateX(14deg); }
            to   { transform: rotateZ(360deg) rotateX(14deg); }
          }

          .tri {
            position: absolute;
            width: 0; height: 0;
            opacity: 0.85;
          }
          /* Triangle 1 — teal, top */
          .tri-1 {
            top: 4px; left: 50%;
            margin-left: -34px;
            border-left: 34px solid transparent;
            border-right: 34px solid transparent;
            border-bottom: 58px solid rgba(52, 232, 165, 0.75);
            animation: triPulse 4s ease-in-out infinite;
            filter: drop-shadow(0 0 14px rgba(52,232,165,0.45));
          }
          /* Triangle 2 — blue, bottom-left, upside down */
          .tri-2 {
            bottom: 30px; left: 44px;
            border-left: 30px solid transparent;
            border-right: 30px solid transparent;
            border-top: 52px solid rgba(59, 130, 246, 0.75);
            animation: triPulse 4s ease-in-out infinite 1.3s;
            filter: drop-shadow(0 0 14px rgba(59,130,246,0.45));
          }
          /* Triangle 3 — cyan, bottom-right */
          .tri-3 {
            bottom: 30px; right: 44px;
            border-left: 30px solid transparent;
            border-right: 30px solid transparent;
            border-bottom: 52px solid rgba(34, 211, 238, 0.65);
            animation: triPulse 4s ease-in-out infinite 2.6s;
            filter: drop-shadow(0 0 14px rgba(34,211,238,0.4));
          }
          @keyframes triPulse {
            0%, 100% { transform: scale(1) translateZ(0px); opacity: 0.85; }
            50%      { transform: scale(1.18) translateZ(40px); opacity: 1; }
          }

          /* ── Floating dots ── */
          .dot {
            position: absolute;
            border-radius: 9999px;
            z-index: 4;
          }
          .dot-1 {
            width: 14px; height: 14px;
            top: 44px; right: 84px;
            background: #34E8A5;
            box-shadow: 0 0 18px rgba(52,232,165,0.8);
            animation: floatY 5s ease-in-out infinite;
          }
          .dot-2 {
            width: 9px; height: 9px;
            bottom: 90px; left: 60px;
            background: #3B82F6;
            box-shadow: 0 0 14px rgba(59,130,246,0.8);
            animation: floatY 6.5s ease-in-out infinite 1s;
          }
          .dot-3 {
            width: 6px; height: 6px;
            top: 130px; left: 34px;
            background: #22D3EE;
            box-shadow: 0 0 10px rgba(34,211,238,0.8);
            animation: floatY 4.5s ease-in-out infinite 2s;
          }
          @keyframes floatY {
            0%, 100% { transform: translateY(0px); }
            50%      { transform: translateY(-22px); }
          }

          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
        `}</style>
      </div>
    </div>
  )
}
