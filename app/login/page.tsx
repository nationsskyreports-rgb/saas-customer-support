'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Eye, EyeOff, ArrowRight, Mail, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { setAgent } from '@/lib/auth'

// Rotating hero taglines
const PHRASES = [
  { pre: 'Unlock ',  hi: 'insights',    post: ' to optimize your WhatsApp strategy',
    sub: 'Access comprehensive analytics to refine your strategy for better results.' },
  { pre: 'Reply ',   hi: 'faster',      post: ' with one unified team inbox',
    sub: 'Every customer conversation in one place, routed to the right agent.' },
  { pre: 'Launch ',  hi: 'campaigns',   post: ' that actually convert',
    sub: 'Send targeted broadcasts and track delivery, reads, and replies live.' },
  { pre: 'Monitor ', hi: 'performance', post: ' across your entire team',
    sub: 'Real-time dashboards and reports for every agent, team, and channel.' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [phraseVisible, setPhraseVisible] = useState(true)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  // rotate hero taglines: fade out → swap → fade in
  useEffect(() => {
    const t = setInterval(() => {
      setPhraseVisible(false)
      setTimeout(() => {
        setPhraseIdx(i => (i + 1) % PHRASES.length)
        setPhraseVisible(true)
      }, 450)
    }, 5000)
    return () => clearInterval(t)
  }, [])

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setError('')

    // SECURITY: password verification happens INSIDE the database (bcrypt via pgcrypto).
    // The password hash never reaches the browser, and we never compare in JS.
    const { data, error: dbErr } = await supabase.rpc('agent_login', {
      p_email: email.trim().toLowerCase(),
      p_password: password,
    })

    if (dbErr) {
      // RPC missing = the security migration SQL was not run yet
      setError(dbErr.message.includes('agent_login')
        ? 'Login system not initialized — run the security SQL migration'
        : `Login failed: ${dbErr.message}`)
      setLoading(false)
      return
    }

    const agent = Array.isArray(data) ? data[0] : data
    if (!agent) {
      // Deliberately generic — never reveal whether the email exists
      setError('Invalid email or password')
      setLoading(false)
      return
    }
    if (!agent.is_active) {
      setError('This account is deactivated')
      setLoading(false)
      return
    }

    const lastStatus = localStorage.getItem('nos_last_status') || 'online'
    await supabase.from('agents').update({ status: lastStatus }).eq('id', agent.id)

    setAgent({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      role: agent.role,
      status: lastStatus,
      max_chats: agent.max_chats,
    })
    router.replace('/dashboard')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="page">

      {/* ═══ Aurora background ═══ */}
      <div className="aurora aurora-1" />
      <div className="aurora aurora-2" />
      <div className="aurora aurora-3" />

      {/* ═══ Star field ═══ */}
      <div className="stars">
        {mounted && Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="star"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              animationDelay: `${(i % 10) * 0.6}s`,
              width: i % 5 === 0 ? '2.5px' : '1.5px',
              height: i % 5 === 0 ? '2.5px' : '1.5px',
            }}
          />
        ))}
      </div>

      {/* ═══ Grid floor ═══ */}
      <div className="grid-floor" />

      {/* ═══ Giant orbital hexagon core (right side) ═══ */}
      <div className="hex-core">
        {/* Outer ring */}
        <svg className="hex hex-outer" viewBox="0 0 200 200">
          <path d="M100 10 L178 55 V145 L100 190 L22 145 V55 Z"
            fill="none" stroke="url(#gradA)" strokeWidth="1.2" strokeLinejoin="round" opacity="0.5" />
          <defs>
            <linearGradient id="gradA" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34E8A5" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
        </svg>
        {/* Middle ring */}
        <svg className="hex hex-mid" viewBox="0 0 200 200">
          <path d="M100 26 L164 63 V137 L100 174 L36 137 V63 Z"
            fill="none" stroke="url(#gradB)" strokeWidth="2" strokeLinejoin="round" opacity="0.75" />
          <defs>
            <linearGradient id="gradB" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#34E8A5" />
            </linearGradient>
          </defs>
        </svg>
        {/* Inner solid */}
        <svg className="hex hex-inner" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="gradC" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34E8A5" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          <path d="M100 44 L148 72 V128 L100 156 L52 128 V72 Z"
            fill="none" stroke="url(#gradC)" strokeWidth="4" strokeLinejoin="round" />
          <text x="100" y="122" textAnchor="middle" fontSize="58" fontWeight="800"
            fill="url(#gradC)" fontFamily="Arial, sans-serif">S</text>
        </svg>
        {/* Orbiting dot */}
        <div className="orbit-ring">
          <span className="orbit-dot" />
        </div>
        <div className="hex-glow" />
      </div>

      {/* ═══ Rotating headline (right side) ═══ */}
      <div className="hero-text">
        <div className={`phrase ${phraseVisible ? 'phrase-in' : 'phrase-out'}`}>
          <h2>
            {PHRASES[phraseIdx].pre}
            <span className="grad-text">{PHRASES[phraseIdx].hi}</span>
            {PHRASES[phraseIdx].post}
          </h2>
          <p>{PHRASES[phraseIdx].sub}</p>
        </div>
        <div className="phrase-dots">
          {PHRASES.map((_, i) => (
            <span key={i} className={i === phraseIdx ? 'dot dot-on' : 'dot'} />
          ))}
        </div>
      </div>

      {/* ═══ Glass login card ═══ */}
      <div className={`card ${mounted ? 'card-in' : ''}`}>
        <div className="card-border" />

        {/* Logo */}
        <div className="logo-row">
          <div className="logo-hex">
            <svg viewBox="0 0 48 48" width="40" height="40">
              <defs>
                <linearGradient id="logoG" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34E8A5" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <path d="M24 3 L42 13.5 V34.5 L24 45 L6 34.5 V13.5 Z"
                fill="none" stroke="url(#logoG)" strokeWidth="3.5" strokeLinejoin="round" />
              <text x="24" y="31" textAnchor="middle" fontSize="19" fontWeight="800"
                fill="url(#logoG)" fontFamily="Arial, sans-serif">S</text>
            </svg>
            <span className="logo-dot" />
          </div>
          <span className="logo-name">SoloTe<span className="teal">c</span></span>
        </div>

        <h1>Welcome back</h1>
        <p className="sub">Log in to your workspace</p>

        {/* Email */}
        <label className="field-label">Email</label>
        <div className="field">
          <Mail className="field-icon" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="you@solotec.com"
          />
        </div>

        {/* Password */}
        <label className="field-label">Password</label>
        <div className="field">
          <Lock className="field-icon" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="••••••••"
          />
          <button type="button" className="eye" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error && <p className="err">{error}</p>}

        <div className="forgot-row">
          <button className="forgot" type="button"
            onClick={() => setError('Password reset: ask your administrator to reset your password from the Agents page')}>
            Forgot password?
          </button>
        </div>

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading || !email.trim() || !password.trim()}
        >
          <span className="btn-shine" />
          {loading
            ? <RefreshCw size={16} className="spin" />
            : <>Login <ArrowRight size={16} className="btn-arrow" /></>}
        </button>

        <p className="support">
          Having trouble? <span>Contact us</span>
        </p>
      </div>

      {/* Footer */}
      <p className="footer">All rights reserved for SoloTec © 2026</p>

      <style jsx>{`
        /* ═══════════ BASE ═══════════ */
        .page {
          position: relative;
          min-height: 100vh;
          background:
            radial-gradient(1100px 700px at 78% 40%, rgba(34, 96, 120, 0.35), transparent 60%),
            radial-gradient(900px 600px at 12% 75%, rgba(24, 74, 96, 0.3), transparent 60%),
            linear-gradient(160deg, #16233E 0%, #101B33 55%, #0D1729 100%);
          overflow: hidden;
          display: flex;
          align-items: center;
          font-family: inherit;
        }

        /* ═══════════ AURORA ═══════════ */
        .aurora {
          position: absolute;
          border-radius: 9999px;
          filter: blur(110px);
          opacity: 0.55;
          pointer-events: none;
        }
        .aurora-1 {
          width: 640px; height: 640px;
          background: radial-gradient(circle, #0E4A5C 0%, transparent 65%);
          top: -180px; right: 8%;
          animation: drift1 22s ease-in-out infinite;
        }
        .aurora-2 {
          width: 520px; height: 520px;
          background: radial-gradient(circle, #123B7A 0%, transparent 65%);
          bottom: -160px; right: 28%;
          animation: drift2 26s ease-in-out infinite;
        }
        .aurora-3 {
          width: 420px; height: 420px;
          background: radial-gradient(circle, #0C5548 0%, transparent 65%);
          top: 30%; left: -140px;
          animation: drift3 30s ease-in-out infinite;
        }
        @keyframes drift1 { 0%,100% { transform: translate(0,0) } 50% { transform: translate(-70px, 50px) } }
        @keyframes drift2 { 0%,100% { transform: translate(0,0) } 50% { transform: translate(60px, -45px) } }
        @keyframes drift3 { 0%,100% { transform: translate(0,0) } 50% { transform: translate(45px, 55px) } }

        /* ═══════════ STARS ═══════════ */
        .stars { position: absolute; inset: 0; pointer-events: none; }
        .star {
          position: absolute;
          background: #A5E3FF;
          border-radius: 9999px;
          opacity: 0.4;
          animation: twinkle 6s ease-in-out infinite;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50%      { opacity: 0.7;  transform: scale(1.4); }
        }

        /* ═══════════ GRID FLOOR ═══════════ */
        .grid-floor {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          height: 46vh;
          background-image:
            linear-gradient(rgba(52, 232, 165, 0.09) 1px, transparent 1px),
            linear-gradient(90deg, rgba(52, 232, 165, 0.09) 1px, transparent 1px);
          background-size: 54px 54px;
          transform: perspective(600px) rotateX(58deg);
          transform-origin: bottom;
          mask-image: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
          -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
          pointer-events: none;
        }

        /* ═══════════ HEX CORE ═══════════ */
        .hex-core {
          position: absolute;
          right: 12%;
          top: 40%;
          transform: translateY(-50%);
          width: 460px;
          height: 460px;
          pointer-events: none;
        }
        .hex {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .hex-outer { animation: spinSlow 40s linear infinite; }
        .hex-mid   { animation: spinRev 28s linear infinite; }
        .hex-inner {
          animation: breathe 7s ease-in-out infinite;
          filter: drop-shadow(0 0 26px rgba(52, 232, 165, 0.4));
        }
        @keyframes spinSlow { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes spinRev  { from { transform: rotate(360deg) } to { transform: rotate(0deg) } }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }

        .orbit-ring {
          position: absolute;
          inset: -14px;
          animation: spinSlow 12s linear infinite;
        }
        .orbit-dot {
          position: absolute;
          top: 6px; left: 50%;
          width: 11px; height: 11px;
          margin-left: -5.5px;
          border-radius: 9999px;
          background: #34E8A5;
          box-shadow: 0 0 18px rgba(52, 232, 165, 0.9), 0 0 40px rgba(52, 232, 165, 0.4);
        }
        .hex-glow {
          position: absolute;
          inset: 20%;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(52, 232, 165, 0.12) 0%, transparent 70%);
          animation: breathe 7s ease-in-out infinite;
        }

        /* ═══════════ HERO TEXT (rotating) ═══════════ */
        .hero-text {
          position: absolute;
          right: calc(12% + 230px);   /* center of the hexagon */
          transform: translateX(50%);
          bottom: 7%;
          width: 620px;
          max-width: 44vw;
          text-align: center;
        }
        .phrase {
          min-height: 118px;          /* fixed height so dots never jump */
          transition: opacity 0.45s ease, transform 0.45s ease;
        }
        .phrase-in  { opacity: 1; transform: translateY(0); }
        .phrase-out { opacity: 0; transform: translateY(10px); }
        .hero-text h2 {
          color: #F1F5F9;
          font-size: 27px;
          font-weight: 700;
          line-height: 1.4;
          margin: 0 0 10px;
          letter-spacing: -0.01em;
        }
        .grad-text {
          background: linear-gradient(90deg, #34E8A5, #38BDF8);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero-text p {
          color: #8B9BB4;
          font-size: 13.5px;
          margin: 0;
        }
        .phrase-dots {
          display: flex;
          justify-content: center;
          gap: 7px;
          margin-top: 18px;
        }
        .dot {
          width: 7px; height: 7px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.18);
          transition: background 0.3s, width 0.3s;
        }
        .dot-on {
          width: 22px;
          background: linear-gradient(90deg, #34E8A5, #38BDF8);
        }

        /* ═══════════ GLASS CARD ═══════════ */
        .card {
          position: relative;
          z-index: 10;
          width: 420px;
          margin-left: 7%;
          padding: 42px 40px 34px;
          border-radius: 22px;
          background: rgba(35, 48, 78, 0.5);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.55),
            0 0 0 1px rgba(52, 232, 165, 0.08),
            0 0 42px rgba(52, 232, 165, 0.10),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .card-in { opacity: 1; transform: translateY(0); }

        /* animated gradient border */
        .card-border {
          position: absolute;
          inset: 0;
          border-radius: 22px;
          padding: 1.6px;
          background: linear-gradient(130deg,
            rgba(52, 232, 165, 0.9),
            rgba(59, 130, 246, 0.45) 30%,
            rgba(148, 210, 255, 0.25) 55%,
            rgba(59, 130, 246, 0.7) 80%,
            rgba(52, 232, 165, 0.9));
          filter: drop-shadow(0 0 6px rgba(52, 232, 165, 0.25));
          background-size: 300% 300%;
          animation: borderFlow 9s ease infinite;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        @keyframes borderFlow {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }

        /* ═══════════ LOGO ═══════════ */
        .logo-row { display: flex; align-items: center; gap: 11px; margin-bottom: 34px; }
        .logo-hex { position: relative; width: 40px; height: 40px; }
        .logo-dot {
          position: absolute;
          top: -3px; right: -3px;
          width: 9px; height: 9px;
          border-radius: 9999px;
          background: #34E8A5;
          box-shadow: 0 0 10px rgba(52, 232, 165, 0.9);
          animation: twinkle 3s ease-in-out infinite;
        }
        .logo-name {
          font-size: 23px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #F8FAFC;
        }
        .teal { color: #34E8A5; }

        /* ═══════════ HEADINGS ═══════════ */
        h1 {
          color: #F8FAFC;
          font-size: 27px;
          font-weight: 700;
          margin: 0 0 6px;
          letter-spacing: -0.02em;
        }
        .sub { color: #8B9BB4; font-size: 14px; margin: 0 0 30px; }

        /* ═══════════ FIELDS ═══════════ */
        .field-label {
          display: block;
          color: #AEBDD4;
          font-size: 12.5px;
          font-weight: 600;
          margin-bottom: 7px;
          letter-spacing: 0.01em;
        }
        .field {
          position: relative;
          margin-bottom: 18px;
        }
        .field :global(.field-icon) {
          position: absolute;
          left: 14px; top: 50%;
          transform: translateY(-50%);
          width: 16px; height: 16px;
          color: #475569;
          pointer-events: none;
          transition: color 0.25s;
        }
        .field:focus-within :global(.field-icon) { color: #34E8A5; }
        .field input {
          width: 100%;
          padding: 12.5px 42px 12.5px 42px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 12px;
          color: #F1F5F9;
          font-size: 14px;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
        }
        .field input::placeholder { color: #5B6B85; }
        .field input:focus {
          border-color: rgba(52, 232, 165, 0.55);
          background: rgba(52, 232, 165, 0.035);
          box-shadow: 0 0 0 3px rgba(52, 232, 165, 0.12);
        }
        .eye {
          position: absolute;
          right: 13px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: #475569;
          cursor: pointer;
          display: flex;
          padding: 2px;
          transition: color 0.2s;
        }
        .eye:hover { color: #94A3B8; }

        /* ═══════════ ERROR ═══════════ */
        .err {
          color: #F87171;
          font-size: 13px;
          font-weight: 500;
          margin: -6px 0 10px;
          animation: shake 0.4s ease;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        /* ═══════════ FORGOT ═══════════ */
        .forgot-row { display: flex; justify-content: flex-end; margin-bottom: 22px; }
        .forgot {
          background: none; border: none;
          color: #64748B;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
        }
        .forgot:hover { color: #34E8A5; }

        /* ═══════════ LOGIN BUTTON ═══════════ */
        .login-btn {
          position: relative;
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 13px;
          background: linear-gradient(90deg, #00B69B, #3B82F6);
          color: #fff;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          overflow: hidden;
          box-shadow: 0 8px 28px rgba(0, 182, 155, 0.35);
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 12px 34px rgba(0, 182, 155, 0.5);
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .login-btn :global(.btn-arrow) { transition: transform 0.25s; }
        .login-btn:hover:not(:disabled) :global(.btn-arrow) { transform: translateX(4px); }
        .login-btn :global(.spin) { animation: rotate 1s linear infinite; }
        @keyframes rotate { to { transform: rotate(360deg) } }

        /* shine sweep */
        .btn-shine {
          position: absolute;
          top: 0; left: -80%;
          width: 50%; height: 100%;
          background: linear-gradient(105deg, transparent, rgba(255, 255, 255, 0.35), transparent);
          transform: skewX(-20deg);
          animation: shine 4.5s ease-in-out infinite;
        }
        @keyframes shine {
          0%, 70%  { left: -80%; }
          85%, 100% { left: 130%; }
        }

        /* ═══════════ SUPPORT / FOOTER ═══════════ */
        .support {
          text-align: center;
          color: #475569;
          font-size: 13px;
          margin: 24px 0 0;
        }
        .support span {
          color: #94A3B8;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.2s;
        }
        .support span:hover { color: #34E8A5; }

        .footer {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          color: #94A3B8;
          font-size: 12.5px;
          font-weight: 500;
          letter-spacing: 0.02em;
          z-index: 5;
          padding: 6px 14px;
          border-radius: 9999px;
          background: rgba(13, 20, 36, 0.5);
          border: 1px solid rgba(52, 232, 165, 0.18);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        /* ═══════════ RESPONSIVE ═══════════ */
        @media (max-width: 1100px) {
          .hex-core { right: -6%; opacity: 0.35; }
          .hero-text { display: none; }
        }
        @media (max-width: 640px) {
          .card { width: calc(100% - 40px); margin: 0 auto; padding: 34px 26px 28px; }
          .hex-core { display: none; }
        }

        /* ═══════════ REDUCED MOTION ═══════════ */
        @media (prefers-reduced-motion: reduce) {
          .aurora, .star, .hex, .orbit-ring, .hex-glow,
          .card-border, .btn-shine, .logo-dot { animation: none !important; }
          .card { transition: none; opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  )
}
