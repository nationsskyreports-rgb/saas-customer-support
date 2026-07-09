'use client'

import { useState } from 'react'
import { Plus, Settings, Trash2, MessageCircle, Heart, Radio } from 'lucide-react'
import { mockChannels } from '@/lib/mock-data'

export default function ChannelsPage() {
  const [channels] = useState(mockChannels)
  const [showModal, setShowModal] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return <MessageCircle className="w-6 h-6 text-green-500" />
      case 'instagram':
        return <Heart className="w-6 h-6 text-pink-500" />
      case 'facebook':
        return <Radio className="w-6 h-6 text-blue-500" />
      default:
        return <MessageCircle className="w-6 h-6 text-gray-500" />
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meta Channels</h1>
          <p className="text-muted-foreground mt-1">Connect and manage WhatsApp, Instagram, and Facebook channels</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Connect Channel
        </button>
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="bg-card rounded-lg p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                  {getChannelIcon(channel.type)}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{channel.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{channel.type}</p>
                </div>
              </div>
              <div
                className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                  channel.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {channel.status.charAt(0).toUpperCase() + channel.status.slice(1)}
              </div>
            </div>

            <div className="space-y-2 mb-4 p-3 bg-secondary rounded-lg">
              <div className="flex justify-between items-start">
                <span className="text-xs text-muted-foreground">Connected</span>
                <span className="text-xs font-medium text-foreground">{channel.connectedAt}</span>
              </div>
              {channel.phoneNumber && (
                <div className="flex justify-between items-start">
                  <span className="text-xs text-muted-foreground">Phone Number</span>
                  <span className="text-xs font-medium text-foreground font-mono">{channel.phoneNumber}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedChannel(channel.id)
                  setShowSettings(true)
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-sm font-medium text-foreground"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button className="px-3 py-2 border border-border rounded-lg hover:bg-secondary transition-colors">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Connect Channel Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold text-foreground mb-4">Connect New Channel</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-secondary transition-colors">
                <MessageCircle className="w-6 h-6 text-green-500" />
                <div className="text-left">
                  <p className="font-medium text-foreground">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Connect your WhatsApp Business Account</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-secondary transition-colors">
                <Heart className="w-6 h-6 text-pink-500" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Instagram</p>
                  <p className="text-xs text-muted-foreground">Connect your Instagram Business Account</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-secondary transition-colors">
                <Radio className="w-6 h-6 text-blue-500" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Facebook</p>
                  <p className="text-xs text-muted-foreground">Connect your Facebook Page</p>
                </div>
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-4 px-4 py-2 text-foreground border border-border rounded-lg hover:bg-secondary transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Drawer */}
      {showSettings && selectedChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-card w-full max-w-md rounded-t-lg p-6 shadow-lg border-t border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Channel Settings</h2>
              <button
                onClick={() => {
                  setShowSettings(false)
                  setSelectedChannel(null)
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Channel Name</label>
                <input
                  type="text"
                  defaultValue={channels.find((c) => c.id === selectedChannel)?.name}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Status</label>
                <select className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Webhook URL</label>
                <input
                  type="text"
                  placeholder="https://your-domain.com/webhook"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Auto-Reply Template</label>
                <select className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary">
                  <option>None</option>
                  <option>Default Welcome</option>
                  <option>Business Hours</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSettings(false)
                    setSelectedChannel(null)
                  }}
                  className="flex-1 px-4 py-2 text-foreground border border-border rounded-lg hover:bg-secondary transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSettings(false)
                    setSelectedChannel(null)
                  }}
                  className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
