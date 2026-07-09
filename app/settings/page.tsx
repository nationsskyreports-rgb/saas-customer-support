'use client'

import { Bell, Lock, Users, Globe, Save } from 'lucide-react'

export default function SettingsPage() {
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
            <button className="w-full px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-sm font-medium text-foreground text-left">
              Change Password
            </button>
            <button className="w-full px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-sm font-medium text-foreground text-left">
              Enable Two-Factor Authentication
            </button>
            <button className="w-full px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-sm font-medium text-foreground text-left">
              Review Active Sessions
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
    </div>
  )
}
