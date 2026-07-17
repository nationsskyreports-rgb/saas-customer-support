'use client'

import { useState } from 'react'
import { Bell, Lock, Users, Globe, Save, X, RefreshCw, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getAgent } from '@/lib/auth'

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const me = getAgent()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const submit = async () => {
    setResult(null)
    if (!me?.id) { setResult({ ok: false, message: 'You must be logged in' }); return }
    if (next.length < 6) { setResult({ ok: false, message: 'New password must be at least 6 characters' }); return }
    if (next !== confirm) { setResult({ ok: false, message: 'New passwords do not match' }); return }

    setSaving(true)
    // SECURITY: the current password is verified and the new one is bcrypt-hashed INSIDE the database
    const { data, error } = await supabase.rpc('change_agent_password', {
      p_agent_id: me.id,
      p_current: current,
      p_new: next,
    })
    setSaving(false)

    if (error) {
      setResult({
        ok: false,
        message: error.message.includes('change_agent_password')
          ? 'Not initialized — run the security SQL migration first'
          : error.message,
      })
      return
    }
    if (data === true) {
      setResult({ ok: true, message: 'Password changed successfully' })
      setCurrent(''); setNext(''); setConfirm('')
      setTimeout(onClose, 1200)
    } else {
      setResult({ ok: false, message: 'Current password is incorrect' })
    }
  }

  const field = 'w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary text-sm'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Lock className="w-5 h-5 text-[#00B69B]" /></div>
            <h3 className="font-bold text-gray-900">Change Password</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Current Password</label>
            <input type={show ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)} className={field} dir="ltr" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">New Password</label>
            <input type={show ? 'text' : 'password'} value={next} onChange={e => setNext(e.target.value)} className={field} dir="ltr" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Confirm New Password</label>
            <input type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} className={field} dir="ltr" />
          </div>
          <button onClick={() => setShow(s => !s)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600">
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {show ? 'Hide' : 'Show'} passwords
          </button>

          {result && (
            <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2.5 border ${result.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
              {result.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />} {result.message}
            </div>
          )}
        </div>

        <button onClick={submit} disabled={saving || !current || !next || !confirm}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: '#00B69B' }}>
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Update Password
        </button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [pwOpen, setPwOpen] = useState(false)
  return (
    <div className="p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and application preferences</p>
      </div>

      {/* Settings Tabs */}
      <div className="mt-8 space-y-6">
        {/* General Settings */}
        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-foreground">General Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Organization Name</label>
              <input
                type="text"
                defaultValue="Nations Of Sky"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Website</label>
              <input
                type="url"
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Industry</label>
              <select className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary">
                <option>E-commerce</option>
                <option>SaaS</option>
                <option>Services</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-foreground">Notifications</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span className="text-sm font-medium text-foreground">Email notifications for urgent messages</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer" />
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span className="text-sm font-medium text-foreground">Daily summary reports</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer" />
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span className="text-sm font-medium text-foreground">New agent onboarding alerts</span>
              <input type="checkbox" className="w-4 h-4 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-foreground">Security</h2>
          </div>
          <div className="space-y-4">
            <button onClick={() => setPwOpen(true)}
              className="w-full px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-sm font-medium text-foreground text-left">
              Change Password
            </button>
            <button disabled title="Coming soon"
              className="w-full px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground text-left opacity-50 cursor-not-allowed">
              Enable Two-Factor Authentication <span className="text-xs">(coming soon)</span>
            </button>
            <button disabled title="Coming soon"
              className="w-full px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground text-left opacity-50 cursor-not-allowed">
              Review Active Sessions <span className="text-xs">(coming soon)</span>
            </button>
          </div>
        </div>

        {/* Team Settings */}
        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-foreground">Team & Billing</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Current Plan</p>
              <p className="text-lg font-bold text-foreground">Professional - $299/month</p>
            </div>
            <button className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-sm font-medium text-foreground">
              Manage Subscription
            </button>
            <button className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-sm font-medium text-foreground">
              Invite Team Members
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="flex items-center gap-2 px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {pwOpen && <ChangePasswordModal onClose={() => setPwOpen(false)} />}
    </div>
  )
}
