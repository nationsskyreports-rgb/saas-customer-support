'use client'

import { useState } from 'react'
import { Settings, RefreshCw, MessageCircle, ToggleLeft, ToggleRight, X } from 'lucide-react'

const channels = [
  {
    id: 1,
    name: 'Nations Of Sky',
    type: 'WhatsApp',
    phone: '+20215555',
    availability: true,
    callCenter: 'Available',
    createdAt: '01/01/2020',
  },
  {
    id: 2,
    name: 'NOS Marketing',
    type: 'WhatsApp',
    phone: '201106973901',
    availability: true,
    callCenter: 'Available',
    createdAt: '01/01/2020',
  },
]

export default function ChannelsPage() {
  const [channelList, setChannelList] = useState(channels)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<typeof channels[0] | null>(null)
  const [assignMode, setAssignMode] = useState<'auto' | 'manual'>('auto')
  const [maxChats, setMaxChats] = useState(5)
  const [welcomeMsg, setWelcomeMsg] = useState('Welcome to Nations Of Sky support! How can we help you today?')
  const [awayMsg, setAwayMsg] = useState('We are currently away. Our team will get back to you shortly.')

  const toggleAvailability = (id: number) => {
    setChannelList(prev =>
      prev.map(ch => ch.id === id ? { ...ch, availability: !ch.availability } : ch)
    )
  }

  const openSettings = (channel: typeof channels[0]) => {
    setSelectedChannel(channel)
    setShowSettings(true)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meta Channels</h1>
        <p className="text-gray-500 mt-1">Manage your WhatsApp Business channels</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="px-6 py-3 text-left text-sm font-semibold">Channel ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Channel Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Channel Type Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Creation Time</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Channel Identifier</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Availability</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Call Center Availability</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {channelList.map((ch) => (
              <tr key={ch.id} className="hover:bg-amber-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-900">{ch.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-900">{ch.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    {ch.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{ch.createdAt} | 12:00 AM</td>
                <td className="px-6 py-4 text-sm font-mono text-gray-900">{ch.phone}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleAvailability(ch.id)}
                    className="flex items-center gap-1.5"
                  >
                    {ch.availability ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-teal-500 text-white text-xs font-bold rounded-full">
                        Yes
                        <span className="w-3 h-3 bg-white rounded-full opacity-80" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-300 text-gray-700 text-xs font-bold rounded-full">
                        No
                        <span className="w-3 h-3 bg-white rounded-full opacity-80" />
                      </span>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{ch.callCenter}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openSettings(ch)}
                      className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Sync Templates
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => openSettings(ch)}
                      className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Set Call Center Availability
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Settings Drawer */}
      {showSettings && selectedChannel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="w-96 h-full bg-white shadow-2xl flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Channel Settings</h2>
                <p className="text-xs text-gray-500">{selectedChannel.name}</p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Channel Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Channel Name</label>
                <input
                  type="text"
                  defaultValue={selectedChannel.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              {/* Phone (readonly) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={selectedChannel.phone}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              <hr className="border-gray-200" />

              {/* Welcome Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Welcome Message</label>
                <textarea
                  value={welcomeMsg}
                  onChange={e => setWelcomeMsg(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                />
              </div>

              {/* Away Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Away Message</label>
                <textarea
                  value={awayMsg}
                  onChange={e => setAwayMsg(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                />
              </div>

              {/* Assignment Mode */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Assignment Mode</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={assignMode === 'auto'}
                      onChange={() => setAssignMode('auto')}
                      className="accent-amber-500"
                    />
                    <span className="text-sm text-gray-700">Auto-assign</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={assignMode === 'manual'}
                      onChange={() => setAssignMode('manual')}
                      className="accent-amber-500"
                    />
                    <span className="text-sm text-gray-700">Manual</span>
                  </label>
                </div>
              </div>

              {/* Max Chats */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Chats per Agent</label>
                <input
                  type="number"
                  value={maxChats}
                  onChange={e => setMaxChats(Number(e.target.value))}
                  min={1}
                  max={20}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: '#C0992F' }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
